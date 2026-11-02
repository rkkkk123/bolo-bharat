'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, X, Sparkles, ShieldCheck } from 'lucide-react';
import { TricolorOrb } from '@/components/TricolorOrb';
import { BackgroundVideo } from '@/components/BackgroundVideo';
import { BoloLogo } from '@/components/BoloLogo';

export default function PortalPage() {
  const router = useRouter();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleOrbClick = () => {
    setShowPermissionModal(true);
  };

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).catch(() => {});
      }
    } finally {
      setIsRequesting(false);
      router.push('/app');
    }
  };

  return (
    <main className="relative w-full min-h-[100dvh] h-[100dvh] overflow-y-auto sm:overflow-hidden flex flex-col items-center justify-between select-none px-4 sm:px-6 py-4 sm:py-7 [padding-top:max(1rem,env(safe-area-inset-top))] [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))]">
      {/* 1. Fullscreen Multi-Video Background (Edge-to-Edge, Vivid, No Dark Overlays, No Controls) */}
      <BackgroundVideo overlayOpacity={0} />

      {/* 2. Soft Ambient Luminous Bloom behind the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[440px] h-[340px] sm:h-[440px] rounded-full pointer-events-none filter blur-3xl opacity-35 bg-[radial-gradient(circle,#FF671F_0%,rgba(255,255,255,0.7)_40%,#046A38_85%)] -z-0" />

      {/* TOP HEADER: Prominent Official Logo & Vision AI Badge (Fully responsive for mobile) */}
      <header className="relative z-10 w-full flex items-center justify-between max-w-md mx-auto pt-1 sm:pt-2">
        {/* Brand Logo & Name */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-xl border border-white/20 shadow-md"
        >
          <BoloLogo size="sm" showBadge={true} />
        </motion.div>

        {/* Vision AI Badge */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
            Vision AI
          </span>
        </motion.div>
      </header>

      {/* CENTER HERO: Pure Floating World-Class Tricolor Orb & Human-Crafted Brand Copy */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center my-auto px-2 py-2 sm:py-4">
        {/* Responsive World-Class 100% Circular 3D Glass Tricolor Orb */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="relative flex items-center justify-center mb-4 sm:mb-6"
        >
          {/* Mobile size (140px) */}
          <div className="block sm:hidden">
            <TricolorOrb size={142} onClick={handleOrbClick} showAura={true} />
          </div>
          {/* Desktop/Tablet size (175px) */}
          <div className="hidden sm:block">
            <TricolorOrb size={175} onClick={handleOrbClick} showAura={true} />
          </div>
        </motion.div>

        {/* Brand Title: BOLO + भारत Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2"
        >
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
            BOLO
          </h1>
          <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white shadow-lg border border-white/30 backdrop-blur-md">
            भारत
          </span>
        </motion.div>

        {/* Clean Human-Crafted Taglines (Floating directly on the video) */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-base sm:text-xl font-bold text-white max-w-xs leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
        >
          Talk to Any Object Around You
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/95 font-hindi max-w-xs leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        >
          कैमरा चालू करें, किसी भी वस्तु पर टैप करें और उसकी आवाज़ व उपयोगी बातें तुरंत सुनें।
        </motion.p>

        {/* 3 Quick Benefit Chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap"
        >
          <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white shadow-sm">
            🎯 Point & Tap
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white shadow-sm">
            🗣️ Hindi & English
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white shadow-sm">
            ⚡ Instant AI
          </span>
        </motion.div>
      </div>

      {/* BOTTOM ACTIONS: Apple-Grade Glassmorphic CTA Pill */}
      <footer className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center gap-2 pt-2 pb-1 sm:pb-3">
        <motion.button
          onClick={handleOrbClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-gradient-to-r from-[#FF671F] via-[#FF8833] to-[#046A38] text-white text-xs sm:text-sm font-bold tracking-wide shadow-[0_12px_36px_rgba(0,0,0,0.4),0_0_24px_rgba(255,103,31,0.35)] hover:shadow-[0_16px_40px_rgba(255,103,31,0.5)] border border-white/40 flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>कैमरा शुरू करें • Open Camera</span>
          <ChevronRight className="w-4 h-4 opacity-80" />
        </motion.button>

        <span className="text-[10px] sm:text-[11px] text-white/85 font-medium tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          या ऊपर गोले पर टैप करें • Or tap the orb above
        </span>
      </footer>

      {/* Camera Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="relative w-full max-w-sm rounded-[32px] bg-neutral-900/95 backdrop-blur-2xl border border-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.6)] p-6 sm:p-7 flex flex-col items-center text-center text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPermissionModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Official Brand Logo Emblem */}
              <div className="relative mb-4 flex items-center justify-center">
                <BoloLogo size="lg" iconOnly={true} isPulsing={true} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-white/40 flex items-center justify-center shadow-md">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Title & Body */}
              <h3 className="text-lg font-bold text-white tracking-tight">
                कैमरा अनुमति (Camera Access)
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-neutral-200 font-medium">
                BOLO आपके सामने रखी वस्तुओं को पहचान कर उनसे तुरंत बात करने के लिए लाइव कैमरे का उपयोग करता है।
              </p>

              {/* Privacy badge */}
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>आपका वीडियो पूरी तरह सुरक्षित और निजी है</span>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 w-full flex flex-col gap-2.5">
                <button
                  onClick={handleGrantPermission}
                  disabled={isRequesting}
                  className="w-full py-3.5 px-5 rounded-full bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white text-xs font-bold tracking-wide shadow-md hover:opacity-95 active:scale-95 transition cursor-pointer"
                >
                  {isRequesting ? 'कैमरा शुरू हो रहा है...' : 'अनुमति दें • Continue'}
                </button>

                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-neutral-400 hover:text-white transition"
                >
                  बाद में • Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
