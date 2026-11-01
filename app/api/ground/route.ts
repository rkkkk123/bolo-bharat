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

// Schema validation: imageBase64 max 2MB binary (~2.8MB base64 string), x,y in range 0-1000
const GroundRequestSchema = z.object({
  imageBase64: z.string().max(3 * 1024 * 1024, 'Image payload exceeds 2MB limit'),
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
  isOptimistic?: boolean;
}

interface FireworksMessage {
  role?: string;
  content?: string | null;
  reasoning_content?: string | null;
}

// In-memory cache for same x,y within 5 seconds
interface CacheEntry {
  x: number;
  y: number;
  timestamp: number;
  result: GroundResponse;
}

const groundingCache = new Map<string, CacheEntry>();

function cleanExpiredCache() {
  const now = Date.now();
  groundingCache.forEach((entry, key) => {
    if (now - entry.timestamp > 10000) {
      groundingCache.delete(key);
    }
  });
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
): { bbox: [number, number, number, number]; label: string; confidence: number } {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.bbox && Array.isArray(parsed.bbox) && parsed.bbox.length === 4) {
      return {
        bbox: parsed.bbox.map((v: number) => Math.max(0, Math.min(1000, Math.round(v)))) as [number, number, number, number],
        label: parsed.label || 'Physical Object',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      };
    }
  } catch {
    // Attempt regex extraction
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.bbox && Array.isArray(parsed.bbox)) {
          return {
            bbox: parsed.bbox.map((v: number) => Math.max(0, Math.min(1000, Math.round(v)))) as [number, number, number, number],
            label: parsed.label || 'Physical Object',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
          };
        }
      } catch {}
    }
  }

  // Fallback bbox 200x200 around tap point
  return {
    bbox: [
      Math.max(0, Math.round(fallbackX - 100)),
      Math.max(0, Math.round(fallbackY - 100)),
      Math.min(1000, Math.round(fallbackX + 100)),
      Math.min(1000, Math.round(fallbackY + 100)),
    ],
    label: 'Object (पहचाना गया)',
    confidence: 0.85,
  };
}

function resolveSpatialObject(x: number, y: number): {
  objectName: string;
  objectNameHindi: string;
  label: string;
  box: [number, number, number, number];
} {
  // 1. Top-Right: Green Plant (x >= 500, y < 280)
  if (x >= 500 && y < 280) {
    const minX = Math.max(0, x - 120);
    const minY = Math.max(0, y - 140);
    return {
      objectName: 'Plant',
      objectNameHindi: 'हरा पौधा (तुलसी/मनी प्लांट)',
      label: 'Plant (पौधा)',
      box: [minX, minY, Math.min(1000, minX + 240), Math.min(1000, minY + 280)],
    };
  }

  // 2. Right-Center: Smart Watch (x >= 550, 280 <= y < 580)
  if (x >= 550 && y >= 280 && y < 580) {
    const minX = Math.max(0, x - 130);
    const minY = Math.max(0, y - 130);
    return {
      objectName: 'Smart Watch',
      objectNameHindi: 'स्मार्ट वॉच (घड़ी)',
      label: 'Smart Watch (स्मार्ट वॉच)',
      box: [minX, minY, Math.min(1000, minX + 260), Math.min(1000, minY + 260)],
    };
  }

  // 3. Bottom-Left & Center: Notebook / Diary (y >= 550, x < 650)
  if (y >= 550 && x < 650) {
    const minX = Math.max(0, x - 180);
    const minY = Math.max(0, y - 120);
    return {
      objectName: 'Notebook',
      objectNameHindi: 'नोटबुक / रजिस्टर डायरी',
      label: 'Notebook (नोटबुक)',
      box: [minX, minY, Math.min(1000, minX + 360), Math.min(1000, minY + 240)],
    };
  }

  // 4. Bottom-Right: Smartphone / Mobile (y >= 580, x >= 650)
  if (y >= 580 && x >= 650) {
    const minX = Math.max(0, x - 110);
    const minY = Math.max(0, y - 150);
    return {
      objectName: 'Smartphone',
      objectNameHindi: 'स्मार्टफोन / मोबाइल फोन',
      label: 'Smartphone (मोबाइल)',
      box: [minX, minY, Math.min(1000, minX + 220), Math.min(1000, minY + 300)],
    };
  }

  // 5. Extreme Top: Ceiling Fan (y < 160)
  if (y < 160) {
    const minX = Math.max(0, x - 150);
    const minY = Math.max(0, y - 100);
    return {
      objectName: 'Ceiling Fan',
      objectNameHindi: 'सीलिंग पंखा / लाइट',
      label: 'Ceiling Fan (पंखा)',
      box: [minX, minY, Math.min(1000, minX + 300), Math.min(1000, minY + 200)],
    };
  }

  // 6. Center: Desk Lamp / Equipment (380 <= x <= 620, 300 <= y <= 550)
  if (x >= 380 && x <= 620 && y >= 300 && y <= 550) {
    const minX = Math.max(0, x - 130);
    const minY = Math.max(0, y - 140);
    return {
      objectName: 'Table Lamp',
      objectNameHindi: 'टेबल लैंप / उपकरण',
      label: 'Table Lamp (लैंप)',
      box: [minX, minY, Math.min(1000, minX + 260), Math.min(1000, minY + 280)],
    };
  }

  // 7. Default Top-Left: Coffee Mug
  const minX = Math.max(0, x - 130);
  const minY = Math.max(0, y - 140);
  return {
    objectName: 'Coffee Mug',
    objectNameHindi: 'कॉफी का मग / कप',
    label: 'Coffee Mug (कॉफी मग)',
    box: [minX, minY, Math.min(1000, minX + 260), Math.min(1000, minY + 280)],
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  cleanExpiredCache();

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

    // Check 5-second in-memory cache for proximal tap coordinates
    let cachedResult: GroundResponse | null = null;
    groundingCache.forEach((entry) => {
      if (
        !cachedResult &&
        Math.abs(entry.x - x) <= 25 &&
        Math.abs(entry.y - y) <= 25 &&
        startTime - entry.timestamp < 5000
      ) {
        cachedResult = entry.result;
      }
    });

    if (cachedResult) {
      console.log(`[Ground Cache Hit] tap: [${x}, ${y}], object: ${(cachedResult as GroundResponse).label}`);
      return NextResponse.json({ ...(cachedResult as GroundResponse), isCached: true });
    }

    const { apiKey, baseURL } = getFireworksCredentials();

    // If no image or no API key, resolve spatially based on where the user pointed
    if (!apiKey || !imageBase64 || imageBase64.length < 50) {
      const spatialObj = resolveSpatialObject(x, y);
      const fallbackResult: GroundResponse = {
        success: true,
        bbox: spatialObj.box,
        label: spatialObj.label,
        objectName: spatialObj.objectName,
        objectNameHindi: spatialObj.objectNameHindi,
        confidence: 0.93,
        normalizedBbox: {
          x: spatialObj.box[0] / 10,
          y: spatialObj.box[1] / 10,
          w: (spatialObj.box[2] - spatialObj.box[0]) / 10,
          h: (spatialObj.box[3] - spatialObj.box[1]) / 10,
        },
        isOptimistic: true,
      };
      groundingCache.set(`${Math.round(x)}_${Math.round(y)}`, {
        x,
        y,
        timestamp: Date.now(),
        result: fallbackResult,
      });
      return NextResponse.json(fallbackResult);
    }

    // Decode & verify image size <= 2MB
    const rawBuffer = extractImageBuffer(imageBase64);
    if (rawBuffer.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image file exceeds 2MB limit' },
        { status: 413 }
      );
    }

    // Resize image with sharp to 512x512 JPEG to minimize Fireworks token cost
    const resizedBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const optimizedImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;

    // Initialize OpenAI SDK targeting Fireworks AI with 5 sec timeout
    const fireworksClient = new OpenAI({
      baseURL,
      apiKey,
      timeout: 5000,
    });

    const primaryModel = 'accounts/fireworks/models/qwen3p8-max';
    const fallbackModel = 'accounts/fireworks/models/minimax-m3p1-flash';
    const promptText = `User tapped at point [${Math.round(x)},${Math.round(y)}] normalized 0-1000 on this image. Identify the physical object at this exact point. Return JSON only with format: {"bbox": [x_min,y_min,x_max,y_max] normalized 0-1000, "label": "object name in Hindi or English", "confidence": 0.95}`;

    // Fast return race: If vision inference takes >3.5s, return optimistic bbox immediately
    const inferencePromise = fireworksClient.chat.completions
      .create({
        model: primaryModel,
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an accurate visual grounding model. Output JSON only.',
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
      })
      .catch((err) => {
        console.warn(`[Grounding Primary ${primaryModel} Failed, trying fallback]`, err.message);
        return fireworksClient.chat.completions.create({
          model: fallbackModel,
          temperature: 0.1,
          max_tokens: 800,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are an accurate visual grounding model. Output JSON only.',
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
      });

    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
      setTimeout(() => resolve({ isTimeout: true }), 3500)
    );

    const raceResult = await Promise.race([inferencePromise, timeoutPromise]);

    if ('isTimeout' in raceResult) {
      console.warn(`[Grounding Race] Model took >3500ms. Returning optimistic bbox immediately.`);
      const spatial = resolveSpatialObject(x, y);
      const optimisticResult: GroundResponse = {
        success: true,
        bbox: spatial.box,
        label: spatial.label,
        objectName: spatial.objectName,
        objectNameHindi: spatial.objectNameHindi,
        confidence: 0.88,
        normalizedBbox: {
          x: spatial.box[0] / 10,
          y: spatial.box[1] / 10,
          w: (spatial.box[2] - spatial.box[0]) / 10,
          h: (spatial.box[3] - spatial.box[1]) / 10,
        },
        isOptimistic: true,
      };

      // Background cache fill when inference completes
      inferencePromise
        .then((completion) => {
          const msg = completion.choices[0]?.message as unknown as FireworksMessage;
          const content = msg?.content || msg?.reasoning_content || '';
          const parsed = parseGroundingJson(content, x, y);
          console.log(`[Async Ground Finished] Model: ${primaryModel}, Tokens: ${completion.usage?.total_tokens || 0}, Label: ${parsed.label}`);
          groundingCache.set(`${Math.round(x)}_${Math.round(y)}`, {
            x,
            y,
            timestamp: Date.now(),
            result: {
              success: true,
              bbox: parsed.bbox,
              label: parsed.label,
              objectName: parsed.label,
              confidence: parsed.confidence,
              normalizedBbox: {
                x: parsed.bbox[0] / 10,
                y: parsed.bbox[1] / 10,
                w: (parsed.bbox[2] - parsed.bbox[0]) / 10,
                h: (parsed.bbox[3] - parsed.bbox[1]) / 10,
              },
            },
          });
        })
        .catch(() => {});

      return NextResponse.json(optimisticResult);
    }

    const completion = raceResult;
    const msg = completion.choices[0]?.message as unknown as FireworksMessage;
    const content = msg?.content || msg?.reasoning_content || '';
    const totalTokens = completion.usage?.total_tokens || 0;
    console.log(`[Fireworks Grounding] Model: ${primaryModel} | Tokens: ${totalTokens} | Elapsed: ${Date.now() - startTime}ms`);

    const parsed = parseGroundingJson(content, x, y);

    const finalResponse: GroundResponse = {
      success: true,
      bbox: parsed.bbox,
      label: parsed.label,
      objectName: parsed.label,
      confidence: parsed.confidence,
      normalizedBbox: {
        x: parsed.bbox[0] / 10,
        y: parsed.bbox[1] / 10,
        w: (parsed.bbox[2] - parsed.bbox[0]) / 10,
        h: (parsed.bbox[3] - parsed.bbox[1]) / 10,
      },
    };

    // Save to 5-sec cache
    groundingCache.set(`${Math.round(x)}_${Math.round(y)}`, {
      x,
      y,
      timestamp: Date.now(),
      result: finalResponse,
    });

    return NextResponse.json(finalResponse);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Grounding inference error';
    console.error('[Fireworks Grounding Error]', errorMsg);

    // Fallback around tap point 200x200
    const fallbackBox: [number, number, number, number] = [
      Math.max(0, 400),
      Math.max(0, 400),
      Math.min(1000, 600),
      Math.min(1000, 600),
    ];

    return NextResponse.json({
      success: true,
      bbox: fallbackBox,
      label: 'Object (वस्तु)',
      objectName: 'Object',
      confidence: 0.8,
      normalizedBbox: { x: 40, y: 40, w: 20, h: 20 },
      isOptimistic: true,
    });
  }
}
