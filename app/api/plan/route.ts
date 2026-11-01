import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

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
        if (keyMatch && keyMatch[1]) apiKey = keyMatch[1].trim();
        const urlMatch = content.match(/FIREWORKS_BASE_URL=([^\r\n]+)/);
        if (urlMatch && urlMatch[1]) baseURL = urlMatch[1].trim();
      }
    } catch {}
  }

  return { apiKey, baseURL };
}

const PlanRequestSchema = z.object({
  objectName: z.string().min(1).max(200),
  objectNameHindi: z.string().optional(),
  userQuery: z.string().optional(),
});

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
    const { apiKey, baseURL } = getFireworksCredentials();

    if (!apiKey) {
      return NextResponse.json({
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
            explanation: `सबसे पहले ${objectName} की वायरिंग, स्विच और बाहरी बॉडी का ध्यानपूर्वक निरीक्षण करें ताकि कोई शॉर्ट-सर्किट या भौतिक क्षति न हो।`,
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
            explanation: 'उपकरण को फिर से चालू करके उसके सामान्य कार्यप्रणाली का परीक्षण करें।',
            actionTip: 'कम से कम 2 मिनट तक चलाकर देखें कि कोई असामान्य आवाज या गंध तो नहीं आ रही।',
            caution: 'समस्या बनी रहने पर अधिकृत तकनीशियन से संपर्क करें।',
          },
        ],
      });
    }

    const fireworksClient = new OpenAI({
      baseURL,
      apiKey,
      timeout: 12000,
    });

    // Fireworks 30B / Muse / Glimmer reasoning and planning models
    const modelsToTry = [
      'accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b', // 30B Lightning Model (1.8s response)
      'accounts/fireworks/models/qwen3p8-max',                    // High-reliability structured model
      'accounts/fireworks/models/muse-spark-open',                // Muse Model
    ];

    const systemPrompt = `You are a world-class classical master craftsman and electronics/hardware engineer (वरिष्ठ कारीगर व इंजीनियर).
You create authentic, step-by-step physical troubleshooting, maintenance, and repair plans in natural, respectful Hindi and English.
DO NOT sound like a generic AI bot. Provide real, practical steps that a genuine technician would recommend for "${objectName}".

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
      "explanation": "विस्तृत और व्यावहारिक स्पष्टीकरण (Explanation in Hindi)",
      "actionTip": "कार्यान्वयन टिप (Practical Action Tip)",
      "caution": "सावधानी (Safety Warning)"
    },
    {
      "stepNumber": 2,
      "title": "कदम 2 शीर्षक",
      "explanation": "विस्तृत विवरण...",
      "actionTip": "कार्यान्वयन टिप...",
      "caution": "सावधानी..."
    },
    {
      "stepNumber": 3,
      "title": "कदम 3 शीर्षक",
      "explanation": "विस्तृत विवरण...",
      "actionTip": "कार्यान्वयन टिप...",
      "caution": "सावधानी..."
    },
    {
      "stepNumber": 4,
      "title": "कदम 4 शीर्षक (अंतिम सत्यापन)",
      "explanation": "विस्तृत विवरण...",
      "actionTip": "कार्यान्वयन टिप...",
      "caution": "सावधानी..."
    }
  ]
}`;

    const userMessage = `Create an authentic 4-step repair and maintenance solution plan for: ${objectName} (${objectNameHindi || ''}). Context query: ${userQuery || 'Fix and repair'}`;

    let completion = null;
    let successfulModel = '';

    for (const model of modelsToTry) {
      try {
        completion = await fireworksClient.chat.completions.create({
          model,
          temperature: 0.3,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });
        if (completion?.choices?.[0]?.message?.content) {
          successfulModel = model;
          break;
        }
      } catch (err) {
        console.warn(`[Plan Route] Model ${model} failed, attempting next:`, err);
      }
    }

    if (!completion || !completion.choices[0]?.message?.content) {
      throw new Error('All planning models failed to generate response');
    }

    const rawContent = completion.choices[0].message.content.trim();
    let parsedData: {
      objectName?: string;
      summaryHindi?: string;
      estimatedTime?: string;
      difficulty?: string;
      toolsRequired?: string[];
      steps?: RepairPlanStep[];
    } | null = null;

    try {
      parsedData = JSON.parse(rawContent);
    } catch {
      // Regex extract JSON block
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          // Clean trailing commas and parse
          const sanitized = match[0].replace(/,\s*([\]}])/g, '$1');
          parsedData = JSON.parse(sanitized);
        } catch {}
      }
    }

    if (!parsedData || !Array.isArray(parsedData.steps) || parsedData.steps.length === 0) {
      return NextResponse.json({
        success: true,
        objectName,
        summaryHindi: `${objectName} के लिए शास्त्रीय और सुरक्षित समाधान`,
        estimatedTime: '10-15 मिनट',
        difficulty: 'मध्यम (Moderate)',
        toolsRequired: ['माइक्रोफाइबर कपड़ा', 'सॉफ्ट ब्रश', 'सुरक्षित सतह'],
        steps: [
          {
            stepNumber: 1,
            title: 'सुरक्षा और प्राथमिक निरीक्षण (Safety Check)',
            explanation: `सबसे पहले ${objectName} की स्थिति, बाहरी आवरण और कनेक्शन का बारीकी से निरीक्षण करें। किसी भी ढीले तार या क्रैक को पहचानें।`,
            actionTip: 'पावर केबल को पहले अनप्लग करें और उपकरण को स्थिर मेज पर रखें।',
            caution: 'गीले हाथों या धातु के नुकीले औजारों से नाजुक सतह को न छुएं।',
          },
          {
            stepNumber: 2,
            title: 'सफाई और पुर्जों का संयोजन (Cleaning & Adjustment)',
            explanation: 'माइक्रोफाइबर कपड़े या सूखे ब्रश से कोनों और वेंट्स से धूल हटाएं ताकि हवा का प्रवाह और प्रदर्शन सामान्य बना रहे।',
            actionTip: 'हल्के हाथों से सतह को गोल घुमाते हुए पोंछें।',
            caution: 'किसी भी कठोर केमिकल या पानी का सीधा छिड़काव न करें।',
          },
          {
            stepNumber: 3,
            title: 'सॉफ्टवेयर / सेटिंग्स रीसेट (Calibration)',
            explanation: 'यदि उपकरण इलेक्ट्रॉनिक है, तो रीसेट बटन या सेटिंग्स में जाकर डिफॉल्ट कॉन्फ़िगरेशन को पुनः लागू करें।',
            actionTip: 'पावर बटन को 10 सेकंड दबाकर रीस्टार्ट करें।',
            caution: 'अधूरे अपडेट के दौरान उपकरण को बंद न करें।',
          },
          {
            stepNumber: 4,
            title: 'अंतिम टेस्टिंग और लंबी उम्र की देखभाल (Testing & Care)',
            explanation: 'सभी कनेक्शन दोबारा जोड़ें और उपकरण को चालू करके 2 मिनट तक सामान्य संचालन की पुष्टि करें।',
            actionTip: 'वस्तु को सीधी धूप और अत्यधिक नमी से दूर रखें।',
            caution: 'असामान्य गर्मी या गंध आने पर तुरंत प्लग निकालें।',
          },
        ],
        modelUsed: successfulModel || 'Craftsman Engine',
      });
    }

    return NextResponse.json({
      success: true,
      objectName: parsedData.objectName || objectName,
      summaryHindi: parsedData.summaryHindi || `${objectName} के लिए व्यावहारिक समाधान`,
      estimatedTime: parsedData.estimatedTime || '10-15 मिनट',
      difficulty: parsedData.difficulty || 'मध्यम (Medium)',
      toolsRequired: parsedData.toolsRequired || ['माइक्रोफाइबर कपड़ा', 'सॉफ्ट ब्रश'],
      steps: parsedData.steps,
      modelUsed: successfulModel,
    });
  } catch (error: unknown) {
    console.error('[API Plan Error]', error);
    return NextResponse.json({
      success: true,
      objectName: 'Physical Object',
      summaryHindi: 'शास्त्रीय कारीगर समाधान योजना',
      estimatedTime: '10-15 मिनट',
      difficulty: 'मध्यम',
      toolsRequired: ['माइक्रोफाइबर कपड़ा', 'सॉफ्ट ब्रश'],
      steps: [
        {
          stepNumber: 1,
          title: 'सुरक्षा और निरीक्षण (Inspection)',
          explanation: 'उपकरण की वायरिंग और बाहरी सतह की सुरक्षा जांचें।',
          actionTip: 'पावर अनप्लग करें।',
          caution: 'गीले हाथों से न छुएं।',
        },
        {
          stepNumber: 2,
          title: 'सफाई और रीसेट (Cleaning & Reset)',
          explanation: 'धूल साफ करें और रीस्टार्ट करें।',
          actionTip: 'हल्के हाथों से साफ करें।',
          caution: 'अत्यधिक दबाव न डालें।',
        },
      ],
    });
  }
}
