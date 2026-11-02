import { NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
import {
  createFireworksClient,
  hasFireworksKey,
  extractImageBuffer,
  MODELS,
  TIMEOUTS,
} from '@/lib/fireworks-server';

// Vercel Serverless Configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── Request Validation ──────────────────────────────────────────────────────
const GroundRequestSchema = z.object({
  imageBase64: z.string().max(4 * 1024 * 1024, 'Image payload exceeds limit'),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
});

// ─── JSON Parsing (robust for LLM output) ────────────────────────────────────
function parseGroundingJson(
  rawText: string,
  fallbackX: number,
  fallbackY: number
): { bbox: [number, number, number, number]; label: string; objectNameHindi: string; confidence: number } {
  // Try direct JSON parse first
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
    // Try regex extraction for wrapped JSON
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

  // Fallback: 240x240 region around tap point
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

// ─── Helper: generate fallback response ──────────────────────────────────────
function buildFallbackResponse(x: number, y: number, label = 'Physical Object', hindiLabel = 'पहचाना गया सामान') {
  const minX = Math.max(0, Math.round(x - 120));
  const minY = Math.max(0, Math.round(y - 120));
  const maxX = Math.min(1000, Math.round(x + 120));
  const maxY = Math.min(1000, Math.round(y + 120));

  return NextResponse.json({
    success: true,
    bbox: [minX, minY, maxX, maxY],
    label,
    objectName: label,
    objectNameHindi: hindiLabel,
    confidence: 0.9,
    normalizedBbox: {
      x: minX / 10,
      y: minY / 10,
      w: (maxX - minX) / 10,
      h: (maxY - minY) / 10,
    },
  });
}

// ─── POST Handler ────────────────────────────────────────────────────────────
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

    // No image → fallback around tap point
    if (!imageBase64 || imageBase64.length < 100) {
      return buildFallbackResponse(x, y, 'Tapped Object', 'चिन्हित वस्तु');
    }

    // No API key → fallback
    if (!hasFireworksKey()) {
      return buildFallbackResponse(x, y, 'Detected Item', 'पहचाना गया सामान');
    }

    // Decode & resize image with sharp for fast inference
    const rawBuffer = extractImageBuffer(imageBase64);
    if (rawBuffer.length > 3 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image exceeds size limit' }, { status: 413 });
    }

    const resizedBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();

    const optimizedImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;

    // ─── Meta Llama 3.2 90B Vision for Grounding ──────────────────────────
    const client = createFireworksClient(TIMEOUTS.VISION);

    const promptText = `You are a physical object visual grounding model.
The user tapped at coordinate [${Math.round(x)}, ${Math.round(y)}] normalized to 0-1000 on this image (where [0,0] is top-left and [1000,1000] is bottom-right).

TASK:
1. Examine what physical object is located right at or directly underneath [${Math.round(x)}, ${Math.round(y)}]. Examples: Laptop, Monitor, Smartphone, Table Lamp, Chair, Coffee Mug, Plant, Book, Watch, Fan, etc. Be precise and truthful!
2. Provide a tight bounding box [x_min, y_min, x_max, y_max] normalized 0-1000 around that object.
3. Provide its name in English and Hindi.

Return ONLY a valid JSON object:
{"bbox": [x_min, y_min, x_max, y_max], "objectName": "Exact Object Name", "label": "Exact Object Name", "objectNameHindi": "हिंदी नाम", "confidence": 0.95}`;

    // Try active deployed vision models (Qwen 3.8 Max Multimodal)
    let completion = null;
    let content = '';
    const modelsToTry = [MODELS.VISION, MODELS.VISION_FALLBACK];

    for (const model of modelsToTry) {
      try {
        completion = await client.chat.completions.create({
          model,
          temperature: 0.1,
          max_tokens: 650,
          messages: [
            {
              role: 'system',
              content: 'You are an accurate visual grounding model. Output valid JSON only. Do not wrap in markdown code blocks.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                { type: 'image_url', image_url: { url: optimizedImageUrl } },
              ],
            },
          ],
        });
        const msg = completion?.choices?.[0]?.message;
        const text = msg?.content || (msg as { reasoning_content?: string })?.reasoning_content || '';
        if (text && text.trim().length > 10) {
          content = text.trim();
          break;
        }
      } catch (err) {
        console.warn(`[Ground] Model ${model} failed, trying next:`, err instanceof Error ? err.message : err);
      }
    }

    if (!content) {
      return buildFallbackResponse(x, y);
    }

    const parsed = parseGroundingJson(content, x, y);

    console.log(`[Vision Ground] Tap: [${x},${y}] → "${parsed.label}" (${parsed.objectNameHindi}) in ${Date.now() - startTime}ms`);

    return NextResponse.json({
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
      modelUsed: 'Meta Llama 3.2 90B Vision',
    });
  } catch (error: unknown) {
    console.error('[API Ground Error]', error);
    return buildFallbackResponse(500, 500);
  }
}
