'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { talkAsObject } from '@/lib/fireworks';
import { speakImmediate, stopSpeech } from '@/lib/speech';
import { Wrench, Volume2, X, Sparkles } from 'lucide-react';

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

  // Fetch Hindi response
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
      const fallback = `नमस्ते! मैं आपका ${objName} हूँ। मैं आपकी रोज़मर्रा की ज़िंदगी में आपकी मदद के लिए तैयार हूँ।`;
      setTranscript(fallback, fallback);
      setFullText(fallback);
    } finally {
      setIsLoadingDialogue(false);
      setIsTalking(true);
    }
  }, [setTranscript, setIsTalking]);

  // When status becomes TALKING, use existing transcript or fetch new one
  useEffect(() => {
    if (status === 'TALKING' && objectName) {
      // Only fetch if we have no real transcript yet
      if (!transcript || transcript.length < 10) {
        fetchDialogue(objectName);
      } else if (fullText !== transcript) {
        // Transcript already provided by the tap pipeline — use it directly
        setFullText(transcript);
        setDisplayedLength(0); // triggers typewriter animation
        setIsTalking(true);
      }
    } else if (status !== 'TALKING') {
      setIsTalking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, objectName, transcript]);

  // Smooth Indic typewriter animation
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
    }, 30);

    return () => clearInterval(interval);
  }, [fullText]);

  // Voice speech synthesis
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
    if (!name) return '✨';
    const lower = name.toLowerCase();
    if (lower.includes('laptop') || lower.includes('screen') || lower.includes('monitor')) return '💻';
    if (lower.includes('keyboard') || lower.includes('mouse')) return '⌨️';
    if (lower.includes('coffee') || lower.includes('mug') || lower.includes('cup')) return '☕';
    if (lower.includes('watch') || lower.includes('clock')) return '⌚';
    if (lower.includes('plant') || lower.includes('flower') || lower.includes('leaf')) return '🌿';
    if (lower.includes('book') || lower.includes('notebook') || lower.includes('diary')) return '📖';
    if (lower.includes('phone') || lower.includes('mobile')) return '📱';
    if (lower.includes('lamp') || lower.includes('light') || lower.includes('bulb')) return '💡';
    if (lower.includes('fan')) return '🪭';
    if (lower.includes('bottle') || lower.includes('water')) return '🍶';
    if (lower.includes('pen') || lower.includes('pencil')) return '✏️';
    return '✨';
  };

  return (
    <AnimatePresence>
      {status === 'TALKING' && (
        <motion.div
          key="talking-sheet"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 340,
            damping: 32,
          }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 450) {
              resetToIdle();
            }
          }}
          className="fixed inset-x-0 bottom-0 z-50 pointer-events-auto rounded-t-[36px] bg-[#10121A]/95 dark:bg-[#0B0D14]/95 text-white backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-5 pb-7 sm:p-6 sm:pb-8 flex flex-col gap-4 max-w-md mx-auto border-t border-white/15 [padding-bottom:max(2rem,env(safe-area-inset-bottom))]"
        >
          {/* Centered Grab Handle */}
          <div className="w-12 h-1 bg-white/25 rounded-full mx-auto cursor-grab active:cursor-grabbing mb-1" />

          {/* Row 1: Classical Object Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 3D Glass Avatar with Tricolor Rim */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF671F]/30 via-white/20 to-[#046A38]/30 border border-white/30 flex items-center justify-center text-2xl shadow-lg backdrop-blur-md">
                <span>{getObjectEmoji(objectName)}</span>
              </div>

              <div className="flex flex-col">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {objectName || 'पहचाना गया सामान'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  <span className="text-[12px] font-semibold text-[#10B981]">
                    लाइव आवाज़ • Bol raha hai
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-medium text-white/50 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    Meta Llama 4
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={resetToIdle}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
              aria-label="Dismiss sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Row 2: Classical Speech Transcript Box */}
          <div className="min-h-[88px] w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center shadow-inner">
            {isLoadingDialogue ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Sparkles className="w-4 h-4 text-[#FF9933] animate-spin" />
                <span>सोच रहा है... (Thinking...)</span>
              </div>
            ) : (
              <p className="w-full text-[15px] sm:text-[16px] leading-[1.65] text-white font-hindi select-text break-words">
                {fullText.slice(0, displayedLength)}
                {displayedLength < fullText.length && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-[#FF671F] animate-pulse align-middle" />
                )}
              </p>
            )}
          </div>

          {/* Row 3: 5-Bar Dancing Equalizer Waveform */}
          <div className="h-6 flex items-center justify-center gap-1.5 py-1">
            {isTalking ? (
              [10, 24, 16, 28, 12].map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    scaleY: [0.35, 1.3, 0.35],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.65 + (idx % 3) * 0.16,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 bg-gradient-to-t from-[#FF671F] via-[#FF9933] to-[#046A38] rounded-full h-full origin-bottom"
                />
              ))
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>बात पूरी हुई (Tap Replay to listen again)</span>
              </div>
            )}
          </div>

          {/* Row 4: Classical Developer Action Pills */}
          <div className="flex items-center gap-3 pt-1">
            {/* Fix Karo CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStatus('REPAIR')}
              className="flex-1 h-13 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF671F] via-[#FF8526] to-[#046A38] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,103,31,0.35)] border border-white/25 active:scale-95 transition cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-white" />
              <span>Fix karo • समाधान</span>
            </motion.button>

            {/* Phir Bolo Replay Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (fullText) {
                  triggerVoice(fullText);
                } else if (objectName) {
                  fetchDialogue(objectName);
                }
              }}
              className="flex-1 h-13 py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#0084FF]" />
              <span>Phir bolo • दोबारा सुनें</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
