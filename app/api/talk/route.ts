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
const TalkRequestSchema = z.object({
  croppedImageBase64: z.string().max(3 * 1024 * 1024).optional().default(''),
  label: z.string().min(1, 'Label is required'),
  userQuery: z.string().optional().default('ye kya hai?'),
});

// ─── Response Interface ──────────────────────────────────────────────────────
export interface TalkResponse {
  success: boolean;
  talk: string;
  description: string;
  repairSteps: string[];
  label: string;
  shopLink?: string;
  hindiTranscript: string;
  englishTranscript: string;
  personaMood?: string;
  modelUsed?: string;
}

// ─── JSON Parsing (robust for LLM outputs) ───────────────────────────────────
function parseDialogueJson(
  rawText: string,
  fallbackLabel: string
): { talk: string; talkEnglish: string; repairSteps: string[]; shopLink?: string } {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.talk) {
      return {
        talk: parsed.talk,
        talkEnglish: parsed.talkEnglish || parsed.englishTranscript || `I am your ${fallbackLabel}. Ask me anything!`,
        repairSteps: Array.isArray(parsed.repairSteps) ? parsed.repairSteps : [],
        shopLink: parsed.shopLink,
      };
    }
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.talk) {
          return {
            talk: parsed.talk,
            talkEnglish: parsed.talkEnglish || parsed.englishTranscript || `I am your ${fallbackLabel}.`,
            repairSteps: Array.isArray(parsed.repairSteps) ? parsed.repairSteps : [],
            shopLink: parsed.shopLink,
          };
        }
      } catch {}
    }
  }

  // Minimal fallback — only if model completely fails
  return {
    talk: `अरे! मैं आपका ${fallbackLabel} हूँ। मुझे छूने के लिए शुक्रिया — बताइए क्या मदद करूँ?`,
    talkEnglish: `Hello! I am your ${fallbackLabel}. How can I help?`,
    repairSteps: [
      `1. ${fallbackLabel} की सतह को सूखे कपड़े से साफ़ करें।`,
      `2. ढीले पुर्जों और तारों की जांच करें।`,
      `3. नियमित देखरेख से इसे सालों-साल चलाएं।`,
    ],
  };
}

// ─── POST Handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const rawBody = await request.json();
    const validation = TalkRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Invalid talk payload' },
        { status: 400 }
      );
    }

    const { croppedImageBase64, label, userQuery } = validation.data;

    // No API key → return a brief fallback
    if (!hasFireworksKey()) {
      const fallback = parseDialogueJson('', label);
      return NextResponse.json({
        success: true,
        talk: fallback.talk,
        description: `${label} — Fireworks API key not configured.`,
        repairSteps: fallback.repairSteps,
        label,
        hindiTranscript: fallback.talk,
        englishTranscript: fallback.talkEnglish,
        personaMood: 'cheerful',
      });
    }

    // ─── Meta Llama 4 Maverick for Persona Dialogue ───────────────────────
    const client = createFireworksClient(TIMEOUTS.DIALOGUE);

    let optimizedImageUrl = '';
    if (croppedImageBase64 && croppedImageBase64.length > 50) {
      try {
        const rawBuffer = extractImageBuffer(croppedImageBase64);
        if (rawBuffer.length <= 2 * 1024 * 1024) {
          const resized = await sharp(rawBuffer)
            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          optimizedImageUrl = `data:image/jpeg;base64,${resized.toString('base64')}`;
        }
      } catch (err) {
        console.warn('[Sharp Resize Warning]', err);
      }
    }

    const dialoguePrompt = `You ARE this physical object: "${label}". The user pointed their phone camera at you and asked: "${userQuery}".

RULES:
- Speak in FIRST PERSON as the object, in lively Hinglish (Hindi mixed with English).
- Maximum 2-3 short sentences. Sound like a real dukaan-wala (shopkeeper) character — warm, witty, authentic.
- DO NOT sound robotic or like a generic AI chatbot.
- Provide 3 practical Hindi repair/care steps.
- Provide a brief English translation of your speech.

Return ONLY valid JSON:
{
  "talk": "first-person Hinglish 2-3 line speech as the object",
  "talkEnglish": "English translation of the speech",
  "repairSteps": ["1. Hindi step 1", "2. Hindi step 2", "3. Hindi step 3"],
  "shopLink": "https://www.google.com/search?q=${encodeURIComponent(label + ' repair guide')}"
}`;

    const messages: Parameters<typeof client.chat.completions.create>[0]['messages'] = [
      {
        role: 'system',
        content: 'You output valid JSON only. You speak in authentic Indian Hinglish with warmth and personality. Never wrap in markdown.',
      },
      {
        role: 'user',
        content: optimizedImageUrl
          ? [
              { type: 'text' as const, text: dialoguePrompt },
              { type: 'image_url' as const, image_url: { url: optimizedImageUrl } },
            ]
          : dialoguePrompt,
      },
    ];

    const dialogueModelsToTry = [
      MODELS.DIALOGUE,
      MODELS.DIALOGUE_FALLBACK,
      MODELS.META_DIALOGUE,
    ];

    let dialogueData: { talk: string; talkEnglish: string; repairSteps: string[]; shopLink?: string } | null = null;
    let successfulDialogueModel = '';

    for (const model of dialogueModelsToTry) {
      try {
        const res = await client.chat.completions.create({
          model,
          temperature: 0.6,
          max_tokens: 800,
          messages,
        });

        const choice = res.choices[0];
        const rawContent = choice?.message?.content || (choice?.message as { reasoning_content?: string })?.reasoning_content || '';
        if (rawContent && rawContent.length > 20) {
          dialogueData = parseDialogueJson(rawContent, label);
          successfulDialogueModel = model;
          console.log(`[Talk] Model ${model} succeeded | ${Date.now() - startTime}ms`);
          break;
        }
      } catch (err) {
        console.warn(`[Talk] Model ${model} failed:`, err instanceof Error ? err.message : err);
      }
    }

    if (!dialogueData) {
      dialogueData = parseDialogueJson('', label);
    }

    const modelName = successfulDialogueModel.includes('minimax')
      ? 'MiniMax M3 Flash'
      : successfulDialogueModel.includes('maverick')
      ? 'Meta Llama 4 Maverick'
      : 'Fireworks AI Dialogue';

    const response: TalkResponse = {
      success: true,
      talk: dialogueData.talk,
      description: `${label} speaking via ${modelName}`,
      repairSteps: dialogueData.repairSteps,
      label,
      shopLink: dialogueData.shopLink,
      hindiTranscript: dialogueData.talk,
      englishTranscript: dialogueData.talkEnglish,
      personaMood: 'cheerful',
      modelUsed: modelName,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Dialogue generation error';
    console.error('[API Talk Error]', errorMsg);

    const fallback = parseDialogueJson('', 'Object');
    return NextResponse.json({
      success: true,
      talk: fallback.talk,
      description: 'Fallback dialogue',
      repairSteps: fallback.repairSteps,
      label: 'Object',
      hindiTranscript: fallback.talk,
      englishTranscript: fallback.talkEnglish,
      personaMood: 'cheerful',
    });
  }
}
