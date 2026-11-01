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

const TalkRequestSchema = z.object({
  croppedImageBase64: z.string().max(3 * 1024 * 1024, 'Cropped image exceeds 2MB limit').optional().default(''),
  label: z.string().min(1, 'Label is required'),
  userQuery: z.string().optional().default('ye kya hai?'),
});

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
}

interface FireworksMessage {
  role?: string;
  content?: string | null;
  reasoning_content?: string | null;
}

function extractImageBuffer(dataUrl: string): Buffer {
  const commaIdx = dataUrl.indexOf(',');
  const raw = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Buffer.from(raw, 'base64');
}

function parseDialogueJson(
  rawText: string,
  fallbackLabel: string
): { talk: string; repairSteps: string[]; shopLink?: string } {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.talk && Array.isArray(parsed.repairSteps)) {
      return {
        talk: parsed.talk,
        repairSteps: parsed.repairSteps,
        shopLink: parsed.shopLink,
      };
    }
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.talk && Array.isArray(parsed.repairSteps)) {
          return {
            talk: parsed.talk,
            repairSteps: parsed.repairSteps,
            shopLink: parsed.shopLink,
          };
        }
      } catch {}
    }
  }

  // Dynamic persona dialogues tailored to each physical object in Bharat shop/home context
  const lower = fallbackLabel.toLowerCase();

  if (lower.includes('watch')) {
    return {
      talk: 'टिक-टिक सेठ जी! मैं आपकी स्मार्ट वॉच हूँ। मेरी स्क्रीन पर उंगलियों के निशान हैं और चार्जर कनेक्ट नहीं हो रहा। पीछे का सेंसर साफ करके चार्ज पर लगाओ!',
      repairSteps: [
        '1. स्ट्रैप और बेल्ट लॉक पिन की जांच करें।',
        '2. ऑप्टिकल सेंसर को सूखे माइक्रोफाइबर कपड़े से पोंछें।',
        '3. 10 सेकंड पावर बटन दबाकर रीस्टार्ट करें।',
      ],
    };
  }

  if (lower.includes('plant')) {
    return {
      talk: 'नमस्ते सेठ जी! मैं आपकी दुकान का पौधा हूँ। मुझे धूप और थोड़ी ताज़ी हवा चाहिए, और गमले की मिट्टी सूख गई है। मुझे आधा लोटा पानी पिला दो!',
      repairSteps: [
        '1. सूखी और पीली पत्तियों को कैंची से छांटें।',
        '2. गमले की मिट्टी में आवश्यकतानुसार पानी डालें।',
        '3. पौधे को पर्याप्त धूप व हवा वाली जगह पर रखें।',
      ],
    };
  }

  if (lower.includes('notebook') || lower.includes('book') || lower.includes('diary')) {
    return {
      talk: 'प्रणाम सेठ जी! मैं आपकी हिसाब-किताब की नोटबुक हूँ। मेरे कई पन्ने मुड़ गए हैं और जिल्द ढीली हो गई है। मुझे ठीक से संभाल कर रैक में रखो!',
      repairSteps: [
        '1. मुड़े हुए पन्नों को सीधा करके भारी किताब के नीचे रखें।',
        '2. बुकबाइंडिंग टेप से फटी जिल्द को जोड़ें।',
        '3. नमी और पानी से दूर सूखी जगह पर रखें।',
      ],
    };
  }

  if (lower.includes('phone') || lower.includes('mobile')) {
    return {
      talk: 'अरे सेठ जी! मैं आपका स्मार्टफोन हूँ। स्क्रीन पर बहुत फिंगरप्रिंट और बैक कवर ढीला हो गया है। मुझे साफ कपड़े से पोंछो और बैक कवर बदल दो!',
      repairSteps: [
        '1. स्क्रीन प्रोटेक्टर और डिस्प्ले को साफ करें।',
        '2. चार्जिंग पोर्ट की धूल को सावधानी से साफ करें।',
        '3. नया बैक कवर लगाकर फोन को सुरक्षित करें।',
      ],
    };
  }

  if (lower.includes('fan')) {
    return {
      talk: 'अरे सेठ जी! मैं आपकी दुकान का पंखा हूँ। 2 साल से ग्रीसिंग नहीं हुई, बहुत चीं-चीं की आवाज़ कर रहा हूँ। मेरे बैरिंग में थोड़ा तेल डाल दो!',
      repairSteps: [
        '1. ब्लेड की धूल सूखे कपड़े से साफ़ करें।',
        '2. मोटर बैरिंग में स्नेहक तेल (लुब्रिकेंट) डालें।',
        '3. कैपेसिटर जांचें और पंखे को बैलेंस करें।',
      ],
    };
  }

  if (lower.includes('lamp') || lower.includes('light')) {
    return {
      talk: 'नमस्ते सेठ जी! मैं आपका टेबल लैंप हूँ। मेरा बल्ब ढीला है और वायर थोड़ा मुड़ गया है। वायर सीधा करके बल्ब टाइट कर दो!',
      repairSteps: [
        '1. पावर केबल और प्लग की जांच करें।',
        '2. बल्ब होल्डर को कसकर टाइट करें।',
        '3. लैंप शेड की धूल साफ करें।',
      ],
    };
  }

  if (lower.includes('coffee') || lower.includes('mug') || lower.includes('cup')) {
    return {
      talk: 'अरे सेठ जी! मैं आपका कॉफ़ी मग हूँ। बहुत दिनों से काम कर रहा हूँ, अंदर चाय-कॉफ़ी के दाग जम गए हैं। मुझे गर्म पानी और बेकिंग सोडा से चमका दो!',
      repairSteps: [
        '1. मग की दरारें और हैंडल का जोड़ जांचें।',
        '2. फूड-ग्रेड सिरेमिक एपॉक्सी से जोड़ें।',
        '3. बेकिंग सोडा और गर्म पानी से दाग साफ करें।',
      ],
    };
  }

  // Generic object speech
  return {
    talk: `अरे सेठ जी! मैं आपका ${fallbackLabel} हूँ। बहुत दिनों से दुकान में आपकी सेवा कर रहा हूँ, थोड़ी सफ़ाई और सर्विस कर दो तो मैं फिर नए जैसा चलने लगूँगा!`,
    repairSteps: [
      `1. ${fallbackLabel} की धूल और सतह को साफ़ करें।`,
      `2. ढीले पुर्जों और तारों की जांच करें।`,
      `3. नियमित देखरेख से इसे सालों-साल चलाएं।`,
    ],
  };
}

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

    const { apiKey, baseURL } = getFireworksCredentials();

    // If API key is not present, return authentic Hinglish dialogue immediately
    if (!apiKey) {
      const fallbackData = parseDialogueJson('', label);
      return NextResponse.json({
        success: true,
        talk: fallbackData.talk,
        description: `${label} in standard physical workspace.`,
        repairSteps: fallbackData.repairSteps,
        label,
        hindiTranscript: fallbackData.talk,
        englishTranscript: `Hello! I am your ${label}. Please service me and I will run great!`,
        personaMood: 'cheerful',
      });
    }

    // Initialize OpenAI client targeting Fireworks
    const fireworksClient = new OpenAI({
      baseURL,
      apiKey,
      timeout: 5000,
    });

    let optimizedImageUrl = '';

    // Optimize cropped image with sharp to 512px if provided
    if (croppedImageBase64 && croppedImageBase64.length > 50) {
      try {
        const rawBuffer = extractImageBuffer(croppedImageBase64);
        if (rawBuffer.length <= 2 * 1024 * 1024) {
          const resizedBuffer = await sharp(rawBuffer)
            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          optimizedImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
        }
      } catch (err) {
        console.warn('[Sharp Crop Resize Warning]', err);
      }
    }

    // Unified Single-Shot Multimodal Persona Dialogue & Repair Guidance
    const primaryModel = 'accounts/fireworks/models/qwen3p8-max';
    const fallbackModel = 'accounts/fireworks/models/minimax-m3p1-flash';

    const dialoguePrompt = `You ARE this physical object: ${label}. User query: "${userQuery}".
Talk as the object in first person in lively Hinglish (maximum 2 lines) to the shop owner, explaining your condition.
Provide 3 practical Hindi repair/care steps.
Return JSON ONLY matching this exact schema:
{
  "talk": "first person Hinglish 2 lines speech",
  "repairSteps": [
    "1. Hindi step 1",
    "2. Hindi step 2",
    "3. Hindi step 3"
  ],
  "shopLink": "https://www.google.com/search?q=${encodeURIComponent(label + ' repair guide hindi')}"
}`;

    let dialogueData: { talk: string; repairSteps: string[]; shopLink?: string };
    const description = `${label} in standard physical workspace.`;

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You output JSON only. Keep speech concise (2 lines) and in authentic Indian persona Hinglish.',
        },
        {
          role: 'user',
          content: optimizedImageUrl
            ? [
                { type: 'text', text: dialoguePrompt },
                { type: 'image_url', image_url: { url: optimizedImageUrl } },
              ]
            : [{ type: 'text', text: dialoguePrompt }],
        },
      ];

      const dialogueRes = await fireworksClient.chat.completions.create({
        model: primaryModel,
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages,
      }).catch((err) => {
        console.warn(`[Dialogue Primary ${primaryModel} Failed, trying fallback]`, err.message);
        return fireworksClient.chat.completions.create({
          model: fallbackModel,
          temperature: 0.5,
          max_tokens: 800,
          response_format: { type: 'json_object' },
          messages,
        });
      });

      const dMsg = dialogueRes.choices[0]?.message as unknown as FireworksMessage;
      const rawDialogueContent = dMsg?.content || dMsg?.reasoning_content || '';
      console.log(`[Fireworks Dialogue] Model: ${primaryModel} | Tokens: ${dialogueRes.usage?.total_tokens || 0} | Total Time: ${Date.now() - startTime}ms`);
      dialogueData = parseDialogueJson(rawDialogueContent, label);
    } catch (dialogueErr) {
      console.warn('[Fireworks Dialogue Model Warning]', dialogueErr);
      dialogueData = parseDialogueJson('', label);
    }

    const responsePayload: TalkResponse = {
      success: true,
      talk: dialogueData.talk,
      description,
      repairSteps: dialogueData.repairSteps,
      label,
      shopLink: dialogueData.shopLink,
      hindiTranscript: dialogueData.talk,
      englishTranscript: `I am your ${label}. Please fix me so I run smoothly!`,
      personaMood: 'cheerful',
    };

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Dialogue generation error';
    console.error('[Fireworks Talk API Error]', errorMsg);

    const fallbackData = parseDialogueJson('', 'Object');
    return NextResponse.json({
      success: true,
      talk: fallbackData.talk,
      description: 'Physical object in Bharat context',
      repairSteps: fallbackData.repairSteps,
      label: 'Object',
      hindiTranscript: fallbackData.talk,
      englishTranscript: 'I am ready to help you.',
      personaMood: 'cheerful',
    });
  }
}
