'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { tokens } from '@/lib/design';
import { Volume2, VolumeX, Wrench, X, CheckCircle2, RotateCcw } from 'lucide-react';

export const BottomSheet: React.FC = () => {
  const {
    status,
    objectName,
    transcript,
    hindiTranscript,
    englishTranscript,
    isTalking,
    repairReason,
    repairCandidates,
    stopTalking,
    setIsTalking,
    triggerRepair,
    resolveRepair,
    resetToIdle,
  } = useBoloStore();

  const [activeTab, setActiveTab] = useState<'hindi' | 'english'>('hindi');

  // Web Speech API text-to-speech integration
  const speakCurrentTranscript = useCallback((textToSpeak: string, lang: 'hi-IN' | 'en-US' = 'hi-IN') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsTalking(true);
    utterance.onend = () => setIsTalking(false);
    utterance.onerror = () => setIsTalking(false);

    window.speechSynthesis.speak(utterance);
  }, [setIsTalking]);

  // Auto-speak when entering TALKING state
  useEffect(() => {
    if (status === 'TALKING' && hindiTranscript) {
      speakCurrentTranscript(hindiTranscript, 'hi-IN');
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [status, hindiTranscript, speakCurrentTranscript]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 pointer-events-none flex flex-col items-center">
      {/* 1. IDLE State Helper Banner */}
      <AnimatePresence>
        {status === 'IDLE' && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={tokens.motion.spring}
            className="mb-8 pointer-events-auto px-5 py-3 rounded-pill bg-white/95 dark:bg-[#14161C]/90 text-[#0A0A0A] dark:text-white shadow-card backdrop-blur-md border border-black/5 dark:border-white/10 flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#0084FF] animate-ping" />
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold tracking-tight">Tap any object to listen</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-hindi leading-hindi">
                किसी भी वस्तु पर टैप करें
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TALKING State: Primary Bottom Sheet */}
      <AnimatePresence>
        {status === 'TALKING' && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={tokens.motion.spring}
            className="w-full max-w-lg pointer-events-auto rounded-t-card bg-white/95 dark:bg-[#14161C]/95 backdrop-blur-xl border-t border-black/5 dark:border-white/10 shadow-sheet p-6 flex flex-col gap-4"
          >
            {/* Grab handle */}
            <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto" />

            {/* Header: Object Title + Close Button */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0084FF]">
                    Object Speaking
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0A0A0A] dark:text-white tracking-tight">
                  {objectName}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isTalking) {
                      stopTalking();
                      if (typeof window !== 'undefined') window.speechSynthesis.cancel();
                    } else {
                      const text = activeTab === 'hindi' ? (hindiTranscript || transcript) : englishTranscript;
                      speakCurrentTranscript(text || '', activeTab === 'hindi' ? 'hi-IN' : 'en-US');
                    }
                  }}
                  className={`p-3 rounded-full transition-all ${
                    isTalking
                      ? 'bg-gradient-to-r from-[#0084FF] to-[#8B5CF6] text-white shadow-lg shadow-purple-500/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                  }`}
                  title={isTalking ? 'Pause speech' : 'Replay speech'}
                >
                  {isTalking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  onClick={resetToIdle}
                  className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                  title="Close and return to IDLE"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Language Switcher Pills */}
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-pill w-fit">
              <button
                onClick={() => {
                  setActiveTab('hindi');
                  if (hindiTranscript) speakCurrentTranscript(hindiTranscript, 'hi-IN');
                }}
                className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition ${
                  activeTab === 'hindi'
                    ? 'bg-white dark:bg-neutral-700 text-[#0A0A0A] dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => {
                  setActiveTab('english');
                  if (englishTranscript) speakCurrentTranscript(englishTranscript, 'en-US');
                }}
                className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition ${
                  activeTab === 'english'
                    ? 'bg-white dark:bg-neutral-700 text-[#0A0A0A] dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                English
              </button>
            </div>

            {/* Live Waveform Equalizer */}
            {isTalking && (
              <div className="flex items-center justify-center gap-1.5 h-7 py-1">
                {[12, 24, 16, 28, 14, 26, 18, 22].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: [0.3, 1.2, 0.4],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8 + (i % 3) * 0.2,
                      ease: 'easeInOut',
                    }}
                    className="w-1 bg-gradient-to-t from-[#0084FF] to-[#8B5CF6] rounded-full h-full origin-bottom"
                  />
                ))}
              </div>
            )}

            {/* Dialogue Transcript with Hindi Line Height 1.6 */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5">
              <p className="text-base text-[#0A0A0A] dark:text-neutral-100 font-hindi leading-hindi">
                {activeTab === 'hindi'
                  ? hindiTranscript || transcript || 'नमस्ते! मैं बोल रहा हूँ...'
                  : englishTranscript || transcript || 'Hello! I am speaking to you...'}
              </p>
            </div>

            {/* Actions: Repair disambiguation & Re-tap */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => triggerRepair('User requested correction', [objectName || 'Main Object', 'Desk Surface', 'Alternate Item'])}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-[#0084FF] dark:hover:text-[#0084FF] transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Wrong object? (सुधारें)</span>
              </button>

              <button
                onClick={resetToIdle}
                className="px-4 py-2 rounded-pill bg-[#0084FF] hover:bg-[#0074E0] text-white text-xs font-semibold shadow-md transition"
              >
                Tap Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. REPAIR State: Disambiguation Sheet */}
      <AnimatePresence>
        {status === 'REPAIR' && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={tokens.motion.spring}
            className="w-full max-w-lg pointer-events-auto rounded-t-card bg-white/95 dark:bg-[#14161C]/95 backdrop-blur-xl border-t border-amber-500/20 shadow-sheet p-6 flex flex-col gap-4"
          >
            <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-lg font-bold text-[#0A0A0A] dark:text-white">
                  Fix Object Identification
                </h3>
              </div>
              <button
                onClick={resetToIdle}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-hindi leading-hindi">
              {repairReason || 'Which object did you intend to speak with? (आप किस वस्तु से बात करना चाहते थे?)'}
            </p>

            {/* Candidate selection chips */}
            <div className="flex flex-wrap gap-2 py-1">
              {repairCandidates.map((candidate) => (
                <button
                  key={candidate}
                  onClick={() => resolveRepair(candidate)}
                  className="flex items-center gap-2 px-4 py-2 rounded-pill bg-neutral-100 dark:bg-neutral-800 hover:bg-[#0084FF] hover:text-white text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-black/5 dark:border-white/10 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{candidate}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={resetToIdle}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-tap object</span>
              </button>

              <button
                onClick={() => resolveRepair(objectName || 'Smart Object')}
                className="px-4 py-2 rounded-pill bg-[#8B5CF6] text-white text-xs font-semibold shadow-sm hover:bg-[#7C3AED] transition"
              >
                Confirm & Speak
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
