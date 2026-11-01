'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { speakImmediate, stopSpeech } from '@/lib/speech';
import {
  Wrench,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface RepairStepItem {
  stepNumber: number;
  title: string;
  explanation: string;
  actionTip: string;
  caution: string;
}

interface RepairPlanData {
  objectName: string;
  summaryHindi: string;
  estimatedTime: string;
  difficulty: string;
  toolsRequired: string[];
  steps: RepairStepItem[];
  modelUsed?: string;
}

export const RepairCarousel: React.FC = () => {
  const { status, objectName, setStatus, resetToIdle } = useBoloStore();
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState<RepairPlanData | null>(null);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);

  // Fetch 30B / Muse / Glimmer planned solution from /api/plan
  const fetchPlan = useCallback(async (objName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectName: objName }),
      });
      const data = await res.json();
      if (data.success && data.steps && data.steps.length > 0) {
        setPlanData(data);
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      // Classical craftsmanship fallback
      setPlanData({
        objectName: objName,
        summaryHindi: `${objName} की मरम्मत और सुरक्षित देखभाल का शास्त्रीय समाधान`,
        estimatedTime: '10-15 मिनट',
        difficulty: 'मध्यम (Moderate)',
        toolsRequired: ['माइक्रोफाइबर कपड़ा', 'सॉफ्ट ब्रश', 'सुरक्षित सतह'],
        steps: [
          {
            stepNumber: 1,
            title: 'सुरक्षा और प्राथमिक निरीक्षण (Safety Check)',
            explanation: `सबसे पहले ${objName} की स्थिति, बाहरी आवरण और कनेक्शन का बारीकी से निरीक्षण करें। किसी भी ढीले तार या क्रैक को पहचानें।`,
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
      });
    } finally {
      setIsLoading(false);
      setActiveStepIdx(0);
    }
  }, []);

  useEffect(() => {
    if (status === 'REPAIR' && objectName) {
      fetchPlan(objectName);
    }
    return () => {
      stopSpeech();
      setSpeakingStep(null);
    };
  }, [status, objectName, fetchPlan]);

  // Read active step out loud
  const speakStep = (step: RepairStepItem) => {
    if (speakingStep === step.stepNumber) {
      stopSpeech();
      setSpeakingStep(null);
      return;
    }

    setSpeakingStep(step.stepNumber);
    const textToSpeak = `कदम ${step.stepNumber}: ${step.title}. ${step.explanation}. टिप: ${step.actionTip}. सावधानी: ${step.caution}`;
    speakImmediate(textToSpeak, {
      onEnd: () => setSpeakingStep(null),
      onError: () => setSpeakingStep(null),
    });
  };

  const currentStep = planData?.steps?.[activeStepIdx];
  const totalSteps = planData?.steps?.length || 4;

  const youtubeGuideUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    'how to fix and repair ' + (objectName || 'item') + ' step by step guide hindi'
  )}`;

  return (
    <AnimatePresence>
      {status === 'REPAIR' && (
        <motion.div
          key="repair-modal"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-0 z-50 pointer-events-auto bg-[#0A0C12]/96 text-white backdrop-blur-2xl flex flex-col justify-between overflow-hidden p-4 sm:p-6 [padding-top:max(1.25rem,env(safe-area-inset-top))] [padding-bottom:max(1.75rem,env(safe-area-inset-bottom))]"
        >
          {/* 1. Classical Developer Header */}
          <header className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <button
              onClick={() => setStatus('TALKING')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>वापस (Back)</span>
            </button>

            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#FF9933]" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                मास्टर रिपेयर और समाधान गाइड
              </h2>
            </div>

            <button
              onClick={resetToIdle}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
              aria-label="Close repair guide"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* 2. Loading State */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF671F]/30 via-white/10 to-[#046A38]/30 flex items-center justify-center border border-white/20 animate-pulse">
                <Sparkles className="w-8 h-8 text-[#FF9933] animate-spin" />
              </div>
              <h3 className="text-base font-bold text-white">
                समाधान योजना तैयार हो रही है...
              </h3>
              <p className="text-xs text-white/60 max-w-xs leading-relaxed">
                30B रीजनिंग मॉडल {objectName} के लिए शास्त्रीय और सुरक्षित कदम तैयार कर रहा है।
              </p>
            </div>
          )}

          {/* 3. Main Classical Solution Card Content */}
          {!isLoading && planData && (
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-3.5 max-w-lg mx-auto w-full">
              {/* Overview & Metadata Glass Pill */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {planData.objectName}
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    सत्यापित कारीगर योजना
                  </span>
                </div>

                <p className="text-xs text-white/80 font-hindi leading-relaxed">
                  {planData.summaryHindi}
                </p>

                {/* Quick Stats Badges */}
                <div className="flex items-center gap-3 pt-1 text-[11px] text-white/70 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF9933]" />
                    <span>समय: {planData.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>कठिनाई: {planData.difficulty}</span>
                  </div>
                </div>

                {/* Tools Chips */}
                {planData.toolsRequired && planData.toolsRequired.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-white/50">आवश्यक सामग्री:</span>
                    {planData.toolsRequired.map((tool, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/15"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Step Selector Tabs (Smooth pill switcher) */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                {planData.steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeStepIdx === idx
                        ? 'bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    कदम {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Classical Step Card */}
              {currentStep && (
                <motion.div
                  key={currentStep.stepNumber}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 p-5 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-xl flex flex-col justify-between gap-3.5"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Step Number + Audio Speaker */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20">
                        कदम {currentStep.stepNumber} / {totalSteps}
                      </span>

                      <button
                        onClick={() => speakStep(currentStep)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          speakingStep === currentStep.stepNumber
                            ? 'bg-[#FF671F] text-white animate-pulse'
                            : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>
                          {speakingStep === currentStep.stepNumber ? 'रुकें' : 'यह कदम सुनें'}
                        </span>
                      </button>
                    </div>

                    {/* Step Title */}
                    <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {currentStep.title}
                    </h4>

                    {/* Step Detailed Explanation */}
                    <p className="text-xs sm:text-sm text-neutral-200 font-hindi leading-relaxed">
                      {currentStep.explanation}
                    </p>

                    {/* Action Tip Box */}
                    <div className="mt-1 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-emerald-300">
                          मुख्य व्यावहारिक कदम (Action Tip)
                        </span>
                        <span className="text-xs text-emerald-100/90 font-hindi leading-normal">
                          {currentStep.actionTip}
                        </span>
                      </div>
                    </div>

                    {/* Caution Box */}
                    {currentStep.caution && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-amber-300">
                            सुरक्षा सावधानी (Caution)
                          </span>
                          <span className="text-xs text-amber-100/90 font-hindi leading-normal">
                            {currentStep.caution}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Navigation Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      onClick={() => setActiveStepIdx((prev) => Math.max(0, prev - 1))}
                      disabled={activeStepIdx === 0}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        activeStepIdx === 0
                          ? 'opacity-30 cursor-not-allowed text-white/40'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>पिछला कदम</span>
                    </button>

                    {activeStepIdx < totalSteps - 1 ? (
                      <button
                        onClick={() => setActiveStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition"
                      >
                        <span>अगला कदम</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={resetToIdle}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-500 active:scale-95 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>समाधान पूरा हुआ • Done</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* 4. Bottom Classical External Help Link */}
          <footer className="w-full pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span className="text-[11px]">BOLO Bharat Classical Repair Assistant</span>
            <a
              href={youtubeGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#FF9933] hover:underline text-[11px] font-semibold"
            >
              <span>YouTube पर वीडियो गाइड देखें</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
