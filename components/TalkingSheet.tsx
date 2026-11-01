'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { talkAsObject } from '@/lib/fireworks';
import { speakImmediate, stopSpeech } from '@/lib/speech';
import { Wrench, Volume2, X } from 'lucide-react';

export const TalkingSheet: React.FC = () => {
  const {
    status,
    objectName,
    transcript,
    isTalking,
    setStatus,
    setIsTalking,
    setTranscript,
    resetToIdle,
  } = useBoloStore();

  const [isLoadingDialogue, setIsLoadingDialogue] = useState(false);
  const [displayedLength, setDisplayedLength] = useState<number>(0);
  const [fullText, setFullText] = useState<string>('');

  // Fetch Hindi response from /lib/fireworks.ts
  const fetchDialogue = useCallback(async (objName: string) => {
    setIsLoadingDialogue(true);
    setDisplayedLength(0);
    try {
      const response = await talkAsObject('', objName);
      if (response.success && response.hindiTranscript) {
        setTranscript(response.hindiTranscript, response.hindiTranscript);
        setFullText(response.hindiTranscript);
      }
    } catch {
      const fallback = `नमस्ते! मैं आपका ${objName} हूँ। आज आपकी क्या मदद कर सकता हूँ?`;
      setTranscript(fallback, fallback);
      setFullText(fallback);
    } finally {
      setIsLoadingDialogue(false);
      setIsTalking(true);
    }
  }, [setTranscript, setIsTalking]);

  // When status becomes TALKING, trigger dialogue generation
  useEffect(() => {
    if (status === 'TALKING' && objectName) {
      if (!transcript || transcript.includes('is speaking')) {
        fetchDialogue(objectName);
      } else {
        setFullText(transcript);
        setDisplayedLength(transcript.length);
        setIsTalking(true);
      }
    } else if (status !== 'TALKING') {
      setIsTalking(false);
    }
  }, [status, objectName, transcript, fetchDialogue, setIsTalking]);

  // Smooth Indic-compatible typewriter animation without breaking Devanagari matras
  useEffect(() => {
    if (!fullText) return;
    setDisplayedLength(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= fullText.length) {
        setDisplayedLength(fullText.length);
        clearInterval(interval);
      } else {
        setDisplayedLength(current);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [fullText]);

  // Voice speech synthesis using robust voice engine
  const triggerVoice = useCallback(
    (textToSpeak: string) => {
      speakImmediate(textToSpeak, {
        onStart: () => setIsTalking(true),
        onEnd: () => setIsTalking(false),
      });
    },
    [setIsTalking]
  );

  // Auto-speak once text is loaded
  useEffect(() => {
    if (status === 'TALKING' && fullText && !isLoadingDialogue) {
      triggerVoice(fullText);
    }
    return () => {
      stopSpeech();
    };
  }, [status, fullText, isLoadingDialogue, triggerVoice]);

  const getObjectEmoji = (name?: string | null) => {
    if (!name) return '📦';
    const lower = name.toLowerCase();
    if (lower.includes('coffee') || lower.includes('mug')) return '☕';
    if (lower.includes('watch')) return '⌚';
    if (lower.includes('plant')) return '🪴';
    if (lower.includes('book') || lower.includes('notebook')) return '📖';
    if (lower.includes('phone')) return '📱';
    return '📦';
  };

  return (
    <AnimatePresence>
      {status === 'TALKING' && (
        <motion.div
          key="talking-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 450) {
              resetToIdle();
            }
          }}
          className="fixed inset-x-0 bottom-0 z-50 pointer-events-auto rounded-t-[32px] bg-white/95 dark:bg-[#12141A]/95 backdrop-blur-2xl shadow-[0_-16px_48px_rgba(0,0,0,0.2)] p-5 pb-8 sm:p-6 sm:pb-8 flex flex-col gap-3.5 sm:gap-4 max-w-md mx-auto border-t border-black/5 dark:border-white/10 [padding-bottom:max(2rem,env(safe-area-inset-bottom))]"
        >
          {/* Centered Grab Handle */}
          <div className="w-[40px] h-[4px] bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto cursor-grab active:cursor-grabbing mb-1" />

          {/* Row 1: 40px avatar circle + objectName + green dot "bol raha hai" 12px */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF671F]/20 via-white/10 to-[#046A38]/20 border border-white/20 flex items-center justify-center text-xl shadow-sm">
                <span>{getObjectEmoji(objectName)}</span>
              </div>

              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[#0A0A0A] dark:text-white leading-tight tracking-tight">
                  {objectName || 'वस्तु'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  <span className="text-[12px] font-semibold text-[#10B981]">
                    bol raha hai
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={resetToIdle}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
              aria-label="Dismiss sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Row 2: Devanagari Transcript - generous padding, zero left clipping, font-hindi 16px 1.6 */}
          <div className="min-h-[80px] w-full px-5 py-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-900/70 border border-black/5 dark:border-white/5 flex items-center overflow-hidden">
            {isLoadingDialogue ? (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#FF671F] animate-ping" />
                <span>सोच रहा है... (Thinking...)</span>
              </div>
            ) : (
              <p className="w-full text-[16px] leading-[1.65] text-[#0A0A0A] dark:text-neutral-100 font-hindi select-text break-words">
                {fullText.slice(0, displayedLength)}
                {displayedLength < fullText.length && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-[#FF671F] animate-pulse align-middle" />
                )}
              </p>
            )}
          </div>

          {/* Row 3: Waveform animation when isTalking true - 5 bars animating height */}
          <div className="h-6 flex items-center justify-center gap-1.5 py-1">
            {isTalking ? (
              [8, 22, 14, 26, 10].map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    scaleY: [0.35, 1.25, 0.35],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.7 + (idx % 3) * 0.18,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 bg-gradient-to-t from-[#FF671F] via-[#FF9933] to-[#046A38] rounded-full h-full origin-bottom"
                />
              ))
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span>बात पूरी हुई (Tap to Replay)</span>
              </div>
            )}
          </div>

          {/* Row 4: Clean Action Pills without double icons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setStatus('REPAIR')}
              className="flex-1 h-12 px-5 rounded-full bg-black text-white hover:bg-neutral-800 active:scale-[0.98] transition font-semibold text-sm flex items-center justify-center gap-2 shadow-sm border border-white/10"
            >
              <Wrench className="w-4 h-4 text-[#FF9933]" />
              <span>Fix karo</span>
            </button>

            <button
              onClick={() => {
                if (fullText) {
                  triggerVoice(fullText);
                } else if (objectName) {
                  fetchDialogue(objectName);
                }
              }}
              className="flex-1 h-12 px-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-[0.98] transition font-semibold text-sm flex items-center justify-center gap-2 border border-black/5 dark:border-white/5"
            >
              <Volume2 className="w-4 h-4 text-[#0084FF]" />
              <span>Phir bolo</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
