import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createFireworksClient,
  hasFireworksKey,
  MODELS,
  TIMEOUTS,
} from '@/lib/fireworks-server';

// Vercel Serverless Configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── Request Validation ──────────────────────────────────────────────────────
const PlanRequestSchema = z.object({
  objectName: z.string().min(1).max(200),
  objectNameHindi: z.string().optional(),
  userQuery: z.string().optional(),
});

// ─── Response Interfaces ─────────────────────────────────────────────────────
export interface RepairPlanStep {
  stepNumber: number;
  title: string;
  explanation: string;
  actionTip: string;
  caution: string;
}

export interface RepairPlanResponse {
  success: boolean;
  objectName: string;
  summaryHindi: string;
  estimatedTime: string;
  difficulty: string;
  toolsRequired: string[];
  steps: RepairPlanStep[];
  modelUsed?: string;
}

// ─── Static fallback plan ────────────────────────────────────────────────────
function buildFallbackPlan(objectName: string): RepairPlanResponse {
  return {
    success: true,
    objectName,
    summaryHindi: `${objectName} के लिए शास्त्रीय समाधान और रखरखाव गाइड`,
    estimatedTime: '10-15 मिनट',
    difficulty: 'मध्यम (Moderate)',
    toolsRequired: ['माइक्रोफाइबर कपड़ा', 'स्क्रूड्राइवर', 'सॉफ्ट ब्रश'],
    steps: [
      {
        stepNumber: 1,
        title: 'सुरक्षा और प्राथमिक निरीक्षण (Safety Check)',
        explanation: `सबसे पहले ${objectName} की वायरिंग, स्विच और बाहरी बॉडी का ध्यानपूर्वक निरीक्षण करें।`,
        actionTip: 'पावर केबल को पहले अनप्लग करें और उपकरण को स्थिर सतह पर रखें।',
        caution: 'गीले हाथों से किसी भी बिजली के हिस्से को न छुएं।',
      },
      {
        stepNumber: 2,
        title: 'सफाई और ढीले पुर्जों की जांच (Cleaning & Inspection)',
        explanation: 'सूखे माइक्रोफाइबर कपड़े या सॉफ्ट ब्रश से धूल और कचरे को हल्के हाथों से साफ करें।',
        actionTip: 'सभी स्क्रू और जोड़ों को हल्का सा कसें।',
        caution: 'कठोर केमिकल या पानी का सीधा छिड़काव न करें।',
      },
      {
        stepNumber: 3,
        title: 'पुनर्स्थापना और टेस्टिंग (Testing & Calibration)',
        explanation: 'उपकरण को फिर से चालू करके सामान्य कार्यप्रणाली का परीक्षण करें।',
        actionTip: 'कम से कम 2 मिनट तक चलाकर देखें कि कोई असामान्य आवाज या गंध तो नहीं।',
        caution: 'समस्या बनी रहने पर अधिकृत तकनीशियन से संपर्क करें।',
      },
      {
        stepNumber: 4,
        title: 'अंतिम सत्यापन और देखभाल (Final Verification)',
        explanation: 'सभी कनेक्शन दोबारा जोड़ें और उपकरण को चालू करके 2 मिनट तक सामान्य संचालन की पुष्टि करें।',
        actionTip: 'वस्तु को सीधी धूप और अत्यधिक नमी से दूर रखें।',
        caution: 'असामान्य गर्मी या गंध आने पर तुरंत प्लग निकालें।',
      },
    ],
    modelUsed: 'Fallback Engine',
  };
}

// ─── POST Handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validation = PlanRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { objectName, objectNameHindi, userQuery } = validation.data;

    // No API key → static fallback
    if (!hasFireworksKey()) {
      return NextResponse.json(buildFallbackPlan(objectName));
    }

    // ─── Meta Llama 4 Scout for Structured Planning ───────────────────────
    const client = createFireworksClient(TIMEOUTS.PLANNING);

    const systemPrompt = `You are a world-class classical master craftsman and hardware engineer (वरिष्ठ कारीगर).
You create authentic, step-by-step repair and maintenance plans in natural, respectful Hindi with English terms where appropriate.
DO NOT sound like a generic AI chatbot. Provide real, practical steps a genuine Indian technician would recommend.

Return ONLY a valid JSON object matching this exact format:
{
  "objectName": "${objectName}",
  "summaryHindi": "व्यावहारिक परिचय और उद्देश्य",
  "estimatedTime": "10-15 मिनट",
  "difficulty": "आसान (Easy) या मध्यम (Medium)",
  "toolsRequired": ["उपकरण 1", "उपकरण 2", "उपकरण 3"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "कदम का शीर्षक (Title)",
      "explanation": "विस्तृत और व्यावहारिक स्पष्टीकरण",
      "actionTip": "कार्यान्वयन टिप",
      "caution": "सावधानी"
    },
    { "stepNumber": 2, "title": "...", "explanation": "...", "actionTip": "...", "caution": "..." },
    { "stepNumber": 3, "title": "...", "explanation": "...", "actionTip": "...", "caution": "..." },
    { "stepNumber": 4, "title": "अंतिम सत्यापन", "explanation": "...", "actionTip": "...", "caution": "..." }
  ]
}`;

    const userMessage = `Create an authentic 4-step repair and maintenance solution plan for: ${objectName} (${objectNameHindi || ''}). Context: ${userQuery || 'Fix and repair'}`;

    // Try deployed models with fallback
    const modelsToTry = [
      MODELS.PLANNING,
      MODELS.PLANNING_30B,
      MODELS.PLANNING_MUSE,
      MODELS.META_PLANNING,
    ];
    let completion = null;
    let successfulModel = '';
    let extractedContent = '';

    for (const model of modelsToTry) {
      try {
        completion = await client.chat.completions.create({
          model,
          temperature: 0.3,
          max_tokens: 1200,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });
        const msg = completion?.choices?.[0]?.message;
        const text = msg?.content || (msg as { reasoning_content?: string })?.reasoning_content || '';
        if (text && text.trim().length > 20) {
          successfulModel = model;
          extractedContent = text.trim();
          break;
        }
      } catch (err) {
        console.warn(`[Plan] Model ${model} failed:`, err instanceof Error ? err.message : err);
      }
    }

    if (!extractedContent) {
      return NextResponse.json(buildFallbackPlan(objectName));
    }

    // Parse the JSON response
    let parsedData: {
      objectName?: string;
      summaryHindi?: string;
      estimatedTime?: string;
      difficulty?: string;
      toolsRequired?: string[];
      steps?: RepairPlanStep[];
    } | null = null;

    try {
      parsedData = JSON.parse(extractedContent);
    } catch {
      const match = extractedContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const sanitized = match[0].replace(/,\s*([\]}])/g, '$1');
          parsedData = JSON.parse(sanitized);
        } catch {}
      }
    }

    if (!parsedData || !Array.isArray(parsedData.steps) || parsedData.steps.length === 0) {
      return NextResponse.json(buildFallbackPlan(objectName));
    }

    // Determine human-friendly model name
    const modelDisplayName = successfulModel.includes('nemotron')
      ? 'Nemotron 30B Craft Engine'
      : successfulModel.includes('muse')
      ? 'Muse Glimmer 30B'
      : successfulModel.includes('minimax')
      ? 'MiniMax M3 Classical Planner'
      : 'Meta Llama 4 Scout';

    return NextResponse.json({
      success: true,
      objectName: parsedData.objectName || objectName,
      summaryHindi: parsedData.summaryHindi || `${objectName} के लिए व्यावहारिक समाधान`,
      estimatedTime: parsedData.estimatedTime || '10-15 मिनट',
      difficulty: parsedData.difficulty || 'मध्यम (Medium)',
      toolsRequired: parsedData.toolsRequired || ['माइक्रोफाइबर कपड़ा', 'सॉफ्ट ब्रश'],
      steps: parsedData.steps,
      modelUsed: modelDisplayName,
    });
  } catch (error: unknown) {
    console.error('[API Plan Error]', error);
    return NextResponse.json(buildFallbackPlan('Physical Object'));
  }
}
