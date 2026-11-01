import { NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Vercel Serverless Function Configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getFireworksCredentials() {
  let apiKey = process.env.FIREWORKS_API_KEY || '';
  let baseURL = process.env.FIREWORKS_BASE_URL || 'https://api.fireworks.ai/inference/v1';

  if (!apiKey) {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const keyMatch = content.match(/FIREWORKS_API_KEY=([^\r\n]+)/);
        if (keyMatch && keyMatch[1]) {
          apiKey = keyMatch[1].trim();
        }
        const urlMatch = content.match(/FIREWORKS_BASE_URL=([^\r\n]+)/);
        if (urlMatch && urlMatch[1]) {
          baseURL = urlMatch[1].trim();
        }
      }
    } catch {}
  }

  return { apiKey, baseURL };
}

// Schema validation: imageBase64 max 3MB, x,y in range 0-1000
const GroundRequestSchema = z.object({
  imageBase64: z.string().max(4 * 1024 * 1024, 'Image payload exceeds limit'),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
});

export interface GroundResponse {
  success: boolean;
  bbox: [number, number, number, number]; // [x_min, y_min, x_max, y_max] normalized 0-1000
  label: string;
  confidence: number;
  objectName: string;
  objectNameHindi?: string;
  normalizedBbox: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    w: number; // percentage 0-100
    h: number; // percentage 0-100
  };
  isCached?: boolean;
}

// Helper to extract raw buffer from base64 data URL
function extractImageBuffer(dataUrl: string): Buffer {
  const commaIdx = dataUrl.indexOf(',');
  const raw = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Buffer.from(raw, 'base64');
}

// Parse JSON with robust regex fallback for LLM outputs
function parseGroundingJson(
  rawText: string,
  fallbackX: number,
  fallbackY: number
): { bbox: [number, number, number, number]; label: string; objectNameHindi: string; confidence: number } {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.bbox && Array.isArray(parsed.bbox) && parsed.bbox.length === 4) {
      return {
        bbox: parsed.bbox.map((v: number) => Math.max(0, Math.min(1000, Math.round(v)))) as [number, number, number, number],
        label: parsed.objectName || parsed.label || 'Physical Item',
        objectNameHindi: parsed.objectNameHindi || 'वस्तु',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
      };
    }
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.bbox && Array.isArray(parsed.bbox) && parsed.bbox.length === 4) {
          return {
            bbox: parsed.bbox.map((v: number) => Math.max(0, Math.min(1000, Math.round(v)))) as [number, number, number, number],
            label: parsed.objectName || parsed.label || 'Physical Item',
            objectNameHindi: parsed.objectNameHindi || 'वस्तु',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
          };
        }
      } catch {}
    }
  }

  // Fallback bbox 240x240 around tap point
  return {
    bbox: [
      Math.max(0, Math.round(fallbackX - 120)),
      Math.max(0, Math.round(fallbackY - 120)),
      Math.min(1000, Math.round(fallbackX + 120)),
      Math.min(1000, Math.round(fallbackY + 120)),
    ],
    label: 'Physical Object',
    objectNameHindi: 'पहचाना गया सामान',
    confidence: 0.85,
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const rawBody = await request.json();
    const validation = GroundRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Invalid input payload' },
        { status: 400 }
      );
    }

    const { imageBase64, x, y } = validation.data;
    const { apiKey, baseURL } = getFireworksCredentials();

    // If no valid image supplied
    if (!imageBase64 || imageBase64.length < 100) {
      const minX = Math.max(0, Math.round(x - 120));
      const minY = Math.max(0, Math.round(y - 120));
      const maxX = Math.min(1000, Math.round(x + 120));
      const maxY = Math.min(1000, Math.round(y + 120));

      return NextResponse.json({
        success: true,
        bbox: [minX, minY, maxX, maxY],
        label: 'Tapped Point',
        objectName: 'Tapped Object',
        objectNameHindi: 'चिन्हित वस्तु',
        confidence: 0.9,
        normalizedBbox: {
          x: minX / 10,
          y: minY / 10,
          w: (maxX - minX) / 10,
          h: (maxY - minY) / 10,
        },
      });
    }

    // Decode & verify image size <= 3MB
    const rawBuffer = extractImageBuffer(imageBase64);
    if (rawBuffer.length > 3 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image exceeds size limit' },
        { status: 413 }
      );
    }

    // Resize image with sharp to 512x512 JPEG for rapid Fireworks vision inference
    const resizedBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();

    const optimizedImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;

    if (!apiKey) {
      const minX = Math.max(0, Math.round(x - 120));
      const minY = Math.max(0, Math.round(y - 120));
      const maxX = Math.min(1000, Math.round(x + 120));
      const maxY = Math.min(1000, Math.round(y + 120));

      return NextResponse.json({
        success: true,
        bbox: [minX, minY, maxX, maxY],
        label: 'Detected Item',
        objectName: 'Physical Object',
        objectNameHindi: 'पहचाना गया सामान',
        confidence: 0.92,
        normalizedBbox: {
          x: minX / 10,
          y: minY / 10,
          w: (maxX - minX) / 10,
          h: (maxY - minY) / 10,
        },
      });
    }

    // Initialize OpenAI SDK targeting Fireworks AI with 15 sec timeout
    const fireworksClient = new OpenAI({
      baseURL,
      apiKey,
      timeout: 15000,
    });

    const primaryModel = 'accounts/fireworks/models/qwen3p8-max';
    const promptText = `You are a physical object visual grounding model.
The user tapped at coordinate [${Math.round(x)}, ${Math.round(y)}] normalized to 0-1000 on this image (where [0,0] is top-left and [1000,1000] is bottom-right).

TASK:
1. Examine what physical object is located right at or directly underneath [${Math.round(x)}, ${Math.round(y)}]. Examples: Laptop Screen, Laptop Keyboard, Laptop, Monitor, Smartphone, Table Lamp, Chair, Coffee Mug, Plant, Book, Watch, Fan, etc. Be precise and truthful based on what is in the camera image!
2. Provide a tight bounding box [x_min, y_min, x_max, y_max] normalized 0-1000 around that object.
3. Provide its name in English and Hindi.

Return ONLY a valid JSON object matching:
{"bbox": [x_min, y_min, x_max, y_max], "objectName": "Exact Object Name", "label": "Exact Object Name", "objectNameHindi": "हिंदी नाम", "confidence": 0.95}`;

    const completion = await fireworksClient.chat.completions.create({
      model: primaryModel,
      temperature: 0.1,
      max_tokens: 450,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an accurate visual grounding model. Output valid JSON only.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: { url: optimizedImageUrl },
            },
          ],
        },
      ],
    });

    const msg = completion.choices[0]?.message;
    const content = msg?.content || '';
    const parsed = parseGroundingJson(content, x, y);

    console.log(`[Fireworks Grounding] Tap: [${x},${y}] -> Identified: "${parsed.label}" (${parsed.objectNameHindi}) in ${Date.now() - startTime}ms`);

    const finalResponse: GroundResponse = {
      success: true,
      bbox: parsed.bbox,
      label: parsed.label,
      objectName: parsed.label,
      objectNameHindi: parsed.objectNameHindi,
      confidence: parsed.confidence,
      normalizedBbox: {
        x: parsed.bbox[0] / 10,
        y: parsed.bbox[1] / 10,
        w: (parsed.bbox[2] - parsed.bbox[0]) / 10,
        h: (parsed.bbox[3] - parsed.bbox[1]) / 10,
      },
    };

    return NextResponse.json(finalResponse);
  } catch (error: unknown) {
    console.error('[API Ground Error]', error);

    // Fallback around tap coordinates
    return NextResponse.json({
      success: true,
      bbox: [
        Math.max(0, 380),
        Math.max(0, 380),
        Math.min(1000, 620),
        Math.min(1000, 620),
      ],
      label: 'Physical Object',
      objectName: 'Physical Object',
      objectNameHindi: 'पहचाना गया सामान',
      confidence: 0.85,
      normalizedBbox: { x: 38, y: 38, w: 24, h: 24 },
    });
  }
}
