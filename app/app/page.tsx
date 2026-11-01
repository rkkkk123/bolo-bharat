'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { CameraView } from '@/components/CameraView';
import { Halo } from '@/components/Halo';
import { Orb } from '@/components/Orb';
import { TalkingSheet } from '@/components/TalkingSheet';
import { RepairCarousel } from '@/components/RepairCarousel';
import { groundObject, talkAsObject, cropImageFromBbox } from '@/lib/fireworks';
import { speakImmediate, primeSpeechSynthesis } from '@/lib/speech';
import { ArrowLeft, RotateCcw, Moon, Sun, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BoloMainExperience() {
  const {
    status,
    bbox,
    objectName,
    setBbox,
    setObjectName,
    setStatus,
    setRepairSteps,
    groundingSuccess,
    groundingFailed,
    resetToIdle,
    setIsTalking,
    isDarkMode,
    toggleDarkMode,
  } = useBoloStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Integrated Point -> Box -> Crop -> Talk pipeline
  const handleCameraTap = useCallback(
    async (point: { x: number; y: number }, imageBase64?: string) => {
      try {
        primeSpeechSynthesis();
        setStatus('GROUNDING');

        // 1. Point -> Box via Fireworks Qwen3-VL
        const groundRes = await groundObject(imageBase64 || '', point.x, point.y);

        if (!groundRes || !groundRes.success) {
          showToast('Phir se tap karo (फिर से टैप करें)');
          groundingFailed();
          return;
        }

        setBbox(groundRes.bbox);
        setObjectName(groundRes.objectName);

        // 2. Crop object from full frame using bounding box
        const croppedImage = await cropImageFromBbox(
          imageBase64 || '',
          groundRes.bboxRaw || groundRes.bbox
        );

        // 3. Cropped Image -> Talks as Object via Fireworks Llama Vision + Persona Dialogue
        const talkRes = await talkAsObject(croppedImage, groundRes.objectName);

        if (talkRes.repairSteps && talkRes.repairSteps.length > 0) {
          setRepairSteps(talkRes.repairSteps);
        }

        // Speak immediately out loud through device speakers!
        speakImmediate(talkRes.talk, {
          onStart: () => setIsTalking(true),
          onEnd: () => setIsTalking(false),
        });

        // Set state to TALKING with speech transcript
        groundingSuccess({
          bbox: groundRes.bbox,
          objectName: groundRes.objectName,
          hindiTranscript: talkRes.talk,
          englishTranscript: talkRes.englishTranscript,
        });
      } catch (err) {
        console.warn('[BOLO Tap Handling Error]', err);
        showToast('Phir se tap karo (फिर से टैप करें)');
        groundingFailed('Recognition failed');
      }
    },
    [setBbox, setObjectName, setStatus, setRepairSteps, setIsTalking, groundingSuccess, groundingFailed]
  );

  // Status label generator for calm header
  const getStatusText = () => {
    switch (status) {
      case 'GROUNDING':
        return 'पहचान जारी है...';
      case 'TALKING':
        return 'बोल रहा है...';
      case 'REPAIR':
        return 'समाधान गाइड';
      default:
        return 'छूकर बात करें';
    }
  };

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#0A0A0A] flex items-center justify-center select-none">
      {/* Mobile-first viewport container (Always dark viewfinder bg-black) */}
      <div className="relative w-full h-full max-w-md max-h-[920px] bg-black text-white shadow-2xl overflow-hidden flex flex-col md:rounded-[40px] md:border md:border-white/10 md:h-[94vh]">
        {/* Calm Developer-Crafted Header */}
        <header className="absolute top-0 inset-x-0 z-40 p-4 pt-5 [padding-top:max(1.25rem,env(safe-area-inset-top))] flex items-center justify-between pointer-events-none">
          {/* Back button + Brand Pill */}
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/"
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:bg-black/80 border border-white/15 transition shadow-sm"
              title="Return to Portal"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-sm text-white">
              {/* Indian Tricolor Micro Emblem */}
              <div className="w-4 h-4 rounded-full overflow-hidden bg-gradient-to-b from-[#FF671F] via-white to-[#046A38] shadow-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#000080]" />
              </div>
              <span className="font-extrabold text-xs tracking-tight text-white">
                BOLO
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-[11px] font-medium text-neutral-300 font-hindi">
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="pointer-events-auto flex items-center gap-2">
            {status !== 'IDLE' && (
              <button
                onClick={resetToIdle}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:bg-black/80 border border-white/15 transition shadow-sm"
                title="Reset to idle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 border border-white/15 shadow-sm hover:scale-105 active:scale-95 transition"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-300" />}
            </button>
          </div>
        </header>

        {/* Viewport: CameraView with guaranteed full height expansion */}
        <div className="flex-1 w-full min-h-0 relative flex flex-col p-2.5 pt-2 pb-2.5">
          <CameraView onTap={handleCameraTap}>
            <Halo
              bbox={bbox}
              isActive={status === 'TALKING' || status === 'REPAIR'}
              objectName={objectName}
            />
          </CameraView>
        </div>

        {/* Floating Toast Notification ("Phir se tap karo") */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 inset-x-6 z-50 flex justify-center pointer-events-none"
            >
              <div className="px-4 py-2 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{toastMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Indian Tricolor Wave Action Orb (Visible when not in sheet overlays) */}
        {status !== 'TALKING' && status !== 'REPAIR' && (
          <Orb
            onClick={() => {
              if (status === 'IDLE') {
                setStatus('GROUNDING');
                handleCameraTap({ x: 50, y: 50 });
              }
            }}
          />
        )}

        {/* Talking Sheet (slides up when status === 'TALKING') */}
        <TalkingSheet />

        {/* Repair Carousel with Internet Search (overlay when status === 'REPAIR') */}
        <RepairCarousel />
      </div>
    </main>
  );
}
