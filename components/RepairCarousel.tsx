'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { Search, Video, X, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';

interface RepairStep {
  stepNumber: number;
  titleHindi: string;
  descHindi: string;
  imageEmoji: string;
  tag: string;
}

export const RepairCarousel: React.FC = () => {
  const { status, objectName, setStatus, resetToIdle, repairSteps } = useBoloStore();
  const [activeStep, setActiveStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic repair guides tailored to the grounded object
  const getSteps = (name?: string | null): RepairStep[] => {
    // If AI generated dynamic repair steps exist from Fireworks, prioritize them
    if (repairSteps && repairSteps.length > 0) {
      return repairSteps.slice(0, 3).map((stepText, idx) => {
        const cleanText = stepText.replace(/^\d+[\.\-\:]\s*/, '');
        return {
          stepNumber: idx + 1,
          titleHindi: cleanText.length > 35 ? cleanText.slice(0, 32) + '...' : cleanText,
          descHindi: stepText,
          imageEmoji: idx === 0 ? '🛠️' : idx === 1 ? '🧰' : '✨',
          tag: idx === 0 ? 'निरीक्षण' : idx === 1 ? 'समाधान' : 'सत्यापन',
        };
      });
    }

    const lower = (name || '').toLowerCase();

    if (lower.includes('coffee') || lower.includes('mug')) {
      return [
        {
          stepNumber: 1,
          titleHindi: 'दरार और हैंडल का निरीक्षण करें',
          descHindi: 'मग की सतह और हैंडल के जोड़ पर बारीक क्रैक देखें। गर्म पेय पदार्थ डालने से पहले सुरक्षा सुनिश्चित करना आवश्यक है।',
          imageEmoji: '☕',
          tag: 'सुरक्षा जांच',
        },
        {
          stepNumber: 2,
          titleHindi: 'फूड-ग्रेड एपॉक्सी से जोड़ें',
          descHindi: 'अलग हुए हैंडल पर उच्च गुणवत्ता वाला नॉन-टॉक्सिक फूड-सेफ सिरेमिक एडहेसिव लगाएं और 24 घंटे सूखने दें।',
          imageEmoji: '🥣',
          tag: 'मरम्मत विधि',
        },
        {
          stepNumber: 3,
          titleHindi: 'चमक लौटाएं और देखभाल करें',
          descHindi: 'पुराने जिद्दी दागों को बेकिंग सोडा और गर्म पानी से हल्के हाथों से पोंछें। मग दोबारा नए जैसा चमकदार दिखेगा।',
          imageEmoji: '✨',
          tag: 'रखरखाव',
        },
      ];
    }

    if (lower.includes('watch')) {
      return [
        {
          stepNumber: 1,
          titleHindi: 'स्ट्रैप, पिन व लॉक जांचें',
          descHindi: 'घड़ी के बेल्ट पिन और लॉकिंग मैकेनिज्म को देखें। धूल या पसीना जमने पर माइक्रोफाइबर कपड़े से हल्के हाथों साफ करें।',
          imageEmoji: '⌚',
          tag: 'हार्डवेयर चेक',
        },
        {
          stepNumber: 2,
          titleHindi: 'सेंसर व स्क्रीन की सफाई',
          descHindi: 'पीछे लगे ऑप्टिकल सेंसर को सूखे कपड़े से पोंछें ताकि पल्स और एक्टिविटी डेटा सटीक रिकॉर्ड हो सके।',
          imageEmoji: '🪞',
          tag: 'सेंसर ट्यूनिंग',
        },
        {
          stepNumber: 3,
          titleHindi: 'सॉफ्ट रीसेट और चार्जिंग',
          descHindi: 'यदि स्क्रीन फ्रीज हो तो 10 सेकंड पावर बटन दबाकर रीस्टार्ट करें। चार्जर के मैग्नेटिक पॉइंट्स को साफ रखें।',
          imageEmoji: '🔋',
          tag: 'सिस्टम रीसेट',
        },
      ];
    }

    return [
      {
        stepNumber: 1,
        titleHindi: 'खराबी या टूट-फूट की पहचान',
        descHindi: `${name || 'वस्तु'} के कमजोर हिस्से, सतह पर आई दरारें या ढीले पुर्जों को ध्यान से चिन्हित करें।`,
        imageEmoji: '🛠️',
        tag: 'पहचान',
      },
      {
        stepNumber: 2,
        titleHindi: 'उचित उपकरण और सामग्री का उपयोग',
        descHindi: 'सामग्री के अनुकूल स्क्रू, सही चिपकने वाला पदार्थ या सफाई घोल का ही इस्तेमाल करें ताकि नुकसान न पहुंचे।',
        imageEmoji: '🧰',
        tag: 'समाधान',
      },
      {
        stepNumber: 3,
        titleHindi: 'मजबूती टेस्ट और लंबे समय तक सुरक्षा',
        descHindi: 'मरम्मत के बाद हल्के दबाव के साथ टिकाऊपन जांचें। नियमित देखभाल से वस्तु सालों-साल चलती रहेगी।',
        imageEmoji: '🌟',
        tag: 'सत्यापन',
      },
    ];
  };

  const steps = getSteps(objectName);

  // Track active slide on horizontal snap scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / (clientWidth * 0.72));
    setActiveStep(Math.min(steps.length - 1, Math.max(0, index)));
  };

  const scrollToStep = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 310 + 16;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
    setActiveStep(index);
  };

  // Proper internet searches as requested by user (Google Search & YouTube guides)
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    'how to fix and repair ' + (objectName || 'household item') + ' hindi guide'
  )}`;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    'how to repair ' + (objectName || 'item') + ' at home'
  )}`;

  return (
    <AnimatePresence>
      {status === 'REPAIR' && (
        <motion.div
          key="repair-carousel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xl flex flex-col justify-between py-6 px-4 [padding-top:max(1.5rem,env(safe-area-inset-top))] [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] pointer-events-auto select-none"
        >
          {/* Top Bar: Back, Clean Title, Progress Dots, Close */}
          <div className="w-full max-w-md mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between text-white">
              <button
                onClick={() => setStatus('TALKING')}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5 text-xs font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>वापस</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-neutral-200 border border-white/15">
                  {objectName || 'वस्तु'} • समाधान गाइड
                </span>
              </div>

              <button
                onClick={resetToIdle}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white/80 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top 3 dots progress indicator */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeStep === idx
                      ? 'w-7 bg-gradient-to-r from-[#FF671F] via-[#FF9933] to-[#046A38]'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Middle: Horizontal Snap Scroll Cards */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full max-w-md mx-auto flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 no-scrollbar items-center px-4"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className="w-[82vw] max-w-[310px] h-[360px] rounded-[24px] bg-[#16181F] p-6 snap-center shrink-0 shadow-2xl flex flex-col justify-between border border-white/10 text-left select-text"
              >
                {/* Card Top: Step Pill & Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wide border border-white/10">
                    चरण {step.stepNumber}
                  </span>
                  <span className="text-[11px] font-medium text-[#FF9933] bg-[#FF671F]/15 px-2.5 py-0.5 rounded-full border border-[#FF671F]/25">
                    {step.tag}
                  </span>
                </div>

                {/* Card Center Visual */}
                <div className="my-auto flex flex-col items-center justify-center py-2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#FF671F]/15 via-white/5 to-[#046A38]/15 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
                    <span>{step.imageEmoji}</span>
                  </div>
                </div>

                {/* Card Content: Hindi Text with 1.6 Line-Height */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-base font-bold text-white leading-snug font-hindi">
                    {step.titleHindi}
                  </h4>
                  <p className="text-xs leading-[1.65] text-neutral-300 font-hindi">
                    {step.descHindi}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom: Proper Internet Search actions (Google & YouTube) */}
          <div className="w-full max-w-md mx-auto flex flex-col gap-2.5">
            {/* Primary: Google Internet Search */}
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-13 py-3.5 px-5 rounded-full bg-gradient-to-r from-[#FF671F] via-[#FF8833] to-[#046A38] hover:opacity-95 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>इंटरनेट पर समाधान खोजें (Search on Google)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Secondary: YouTube video repair guide */}
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <Video className="w-4 h-4 text-red-500" />
              <span>वीडियो गाइड देखें (Watch Video Guides)</span>
            </a>

            {/* Return action */}
            <button
              onClick={() => setStatus('TALKING')}
              className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>समाधान पूरा हुआ • वापस बोलें</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
