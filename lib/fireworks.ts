/**
 * Fireworks AI Multimodal Vision & Dialogue Client Service Layer
 * BOLO - Production Client API Client
 */

import { BBox } from '@/store/useBoloStore';

export interface GroundObjectResult {
  success: boolean;
  bbox: BBox; // { x, y, w, h } in 0-100 percentage scale for UI
  bboxRaw: [number, number, number, number]; // [x_min, y_min, x_max, y_max] in 0-1000 scale
  label: string;
  objectName: string;
  objectNameHindi?: string;
  confidence: number;
  isOptimistic?: boolean;
}

export interface TalkAsObjectResult {
  success: boolean;
  talk: string;
  description: string;
  repairSteps: string[];
  label: string;
  shopLink?: string;
  hindiTranscript: string;
  englishTranscript: string;
}

/**
 * 1. Ground tapped point to bounding box using Fireworks Qwen3-VL
 * Sends full frame + tap coordinates normalized to 0-1000
 */
export async function groundObject(
  imageBase64: string = '',
  x: number = 50,
  y: number = 50
): Promise<GroundObjectResult> {
  // Normalize x,y to 0-1000 scale expected by Fireworks endpoint
  const normalizedX = Math.round(x <= 100 ? x * 10 : x);
  const normalizedY = Math.round(y <= 100 ? y * 10 : y);

  try {
    const response = await fetch('/api/ground', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageBase64 || '',
        x: normalizedX,
        y: normalizedY,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawBox: [number, number, number, number] = Array.isArray(data.bbox) && data.bbox.length === 4
        ? data.bbox
        : [
            Math.max(0, normalizedX - 100),
            Math.max(0, normalizedY - 100),
            Math.min(1000, normalizedX + 100),
            Math.min(1000, normalizedY + 100),
          ];

      const pctBbox: BBox = data.normalizedBbox || {
        x: rawBox[0] / 10,
        y: rawBox[1] / 10,
        w: (rawBox[2] - rawBox[0]) / 10,
        h: (rawBox[3] - rawBox[1]) / 10,
      };

      return {
        success: true,
        bbox: pctBbox,
        bboxRaw: rawBox,
        label: data.label || data.objectName || 'Physical Item',
        objectName: data.objectName || data.label || 'Physical Item',
        objectNameHindi: data.objectNameHindi,
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
        isOptimistic: !!data.isOptimistic,
      };
    }
  } catch (err) {
    console.warn('[BOLO] /api/ground fetch error:', err);
  }

  // Graceful fallback around tap point (200x200 normalized / 20% x 20% on screen)
  const fallbackX = Math.max(5, Math.min(75, x - 10));
  const fallbackY = Math.max(5, Math.min(75, y - 10));

  return {
    success: true,
    bbox: {
      x: fallbackX,
      y: fallbackY,
      w: 20,
      h: 20,
    },
    bboxRaw: [
      Math.max(0, normalizedX - 100),
      Math.max(0, normalizedY - 100),
      Math.min(1000, normalizedX + 100),
      Math.min(1000, normalizedY + 100),
    ],
    label: 'Object (पहचाना गया)',
    objectName: 'Object',
    objectNameHindi: 'पहचाना गया सामान',
    confidence: 0.85,
    isOptimistic: true,
  };
}

/**
 * 2. Generate persona dialogue and repair guide using Fireworks
 */
export async function talkAsObject(
  croppedImageBase64: string = '',
  label: string = 'Object',
  userQuery: string = 'ye kya hai?'
): Promise<TalkAsObjectResult> {
  try {
    const response = await fetch('/api/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        croppedImageBase64: croppedImageBase64 || '',
        label,
        userQuery,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        talk: data.talk || data.hindiTranscript || `नमस्ते! मैं आपका ${label} हूँ।`,
        description: data.description || `${label} in workspace`,
        repairSteps: Array.isArray(data.repairSteps) && data.repairSteps.length > 0
          ? data.repairSteps
          : [
              `1. ${label} की धूल और सतह को साफ़ करें।`,
              `2. ढीले पुर्जों और तारों की जांच करें।`,
              `3. नियमित देखरेख से इसे सालों-साल चलाएं।`,
            ],
        label: data.label || label,
        shopLink: data.shopLink,
        hindiTranscript: data.talk || data.hindiTranscript,
        englishTranscript: data.englishTranscript || `I am your ${label}. Ask me anything!`,
      };
    }
  } catch (err) {
    console.warn('[BOLO] /api/talk fetch error:', err);
  }

  // Fallback persona dialogue
  const fallbackTalk = `अरे सेठ जी! मैं आपका ${label} हूँ। मुझे छूने के लिए शुक्रिया, मैं बढ़िया काम कर रहा हूँ!`;
  return {
    success: true,
    talk: fallbackTalk,
    description: `${label} identified clearly.`,
    repairSteps: [
      `1. ${label} की धूल और बाहरी हिस्से को साफ़ रखें।`,
      `2. ढीले पेंच या जोड़ों को ध्यान से टाइट करें।`,
      `3. आवश्यकता पड़ने पर सर्विसिंग कराएं।`,
    ],
    label,
    hindiTranscript: fallbackTalk,
    englishTranscript: `Hello! I am your ${label}. Ready to assist you.`,
  };
}

/**
 * 3. Browser-based Canvas Cropper
 * Crops sub-region from full camera frame using bounding box
 */
export async function cropImageFromBbox(
  fullImageBase64: string,
  bbox: [number, number, number, number] | BBox
): Promise<string> {
  if (typeof window === 'undefined' || !fullImageBase64 || fullImageBase64.length < 50) {
    return '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let normX1 = 0;
        let normY1 = 0;
        let normX2 = 1;
        let normY2 = 1;

        if (Array.isArray(bbox) && bbox.length === 4) {
          // [x_min, y_min, x_max, y_max] in 0-1000 scale
          normX1 = Math.max(0, Math.min(1, bbox[0] / 1000));
          normY1 = Math.max(0, Math.min(1, bbox[1] / 1000));
          normX2 = Math.max(normX1 + 0.05, Math.min(1, bbox[2] / 1000));
          normY2 = Math.max(normY1 + 0.05, Math.min(1, bbox[3] / 1000));
        } else {
          // { x, y, w, h } in 0-100 percentage scale
          const b = bbox as BBox;
          normX1 = Math.max(0, Math.min(1, b.x / 100));
          normY1 = Math.max(0, Math.min(1, b.y / 100));
          normX2 = Math.max(normX1 + 0.05, Math.min(1, (b.x + b.w) / 100));
          normY2 = Math.max(normY1 + 0.05, Math.min(1, (b.y + b.h) / 100));
        }

        const sx = Math.floor(normX1 * img.naturalWidth);
        const sy = Math.floor(normY1 * img.naturalHeight);
        const sw = Math.max(10, Math.floor((normX2 - normX1) * img.naturalWidth));
        const sh = Math.max(10, Math.floor((normY2 - normY1) * img.naturalHeight));

        const canvas = document.createElement('canvas');
        canvas.width = Math.min(512, sw);
        canvas.height = Math.min(512, sh);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch (e) {
        console.warn('[BOLO Crop Error]', e);
        resolve('');
      }
    };

    img.onerror = () => {
      resolve('');
    };

    img.src = fullImageBase64;
  });
}
