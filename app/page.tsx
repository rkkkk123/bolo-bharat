'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { TricolorOrb } from '@/components/TricolorOrb';
import { BackgroundVideo } from '@/components/BackgroundVideo';

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
    <main className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#0A0A0A] text-white flex flex-col items-center justify-center select-none px-6">
      {/* High-Fidelity Multi-Video Looping Background with Seamless Crossfade */}
      <BackgroundVideo overlayOpacity={0.62} showControls={true} />

      {/* Gentle Tricolor Ambient Backlight */}
      <div className="absolute w-[520px] h-[520px] rounded-full pointer-events-none filter blur-3xl opacity-35 bg-[radial-gradient(circle_at_top,#FF671F_0%,rgba(255,255,255,0.2)_40%,#046A38_80%)] z-1" />

      {/* Center Hero: Indian Tricolor Fluid Wave Orb + Calm Developer Typography */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        {/* Industry-Grade Tricolor Wave Orb (150px) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 24,
          }}
          className="relative flex items-center justify-center"
        >
          <TricolorOrb
            size={150}
            onClick={handleOrbClick}
            showAura={true}
          />
        </motion.div>

        {/* Calm & Picture of Greatness Typography */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          {/* Brand Name */}
          <div className="flex items-center gap-2">
            <h1 className="text-[36px] font-extrabold tracking-tight text-white font-sans drop-shadow-md">
              BOLO
            </h1>
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#FF9933] border border-[#FF9933]/30 backdrop-blur-md">
              Bharat
            </span>
          </div>

          {/* Requested Halo Voice Text */}
          <p className="text-[17px] font-medium text-neutral-100 tracking-tight max-w-md leading-relaxed drop-shadow-sm">
            Halo, I am ready to help you through your daily life pain...
          </p>

          {/* Calm Hindi Subtitle */}
          <p className="text-[14px] text-neutral-300 font-hindi max-w-sm leading-[1.6] drop-shadow-sm">
            नमस्ते, मैं आपकी रोज़मर्रा की ज़िंदगी के हर काम और मुश्किल को आसान बनाने के लिए तैयार हूँ।
          </p>

          {/* Tap Prompt Hint Pill */}
          <motion.button
            onClick={handleOrbClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="mt-4 px-5 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-xs font-semibold text-neutral-200 tracking-wide transition shadow-lg flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF671F] animate-ping" />
            <span>शुरू करने के लिए ऊपर टैप करें • Tap Orb to Begin</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Custom Permission Modal - Developer Crafted & Clean */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative w-full max-w-sm rounded-[32px] bg-[#12141A]/95 border border-white/15 shadow-[0_32px_80px_rgba(0,0,0,0.8)] p-7 flex flex-col items-center text-center backdrop-blur-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPermissionModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Tricolor Mini Orb Badge */}
              <div className="relative mb-5 flex items-center justify-center">
                <TricolorOrb size={60} showAura={false} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#12141A] border border-white/20 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Title & Body */}
              <h3 className="text-xl font-bold text-white tracking-tight">
                कैमरा अनुमति (Camera Access)
              </h3>

              <p className="mt-2.5 text-xs leading-relaxed text-neutral-300">
                BOLO भौतिक वस्तुओं को पहचान कर हिंदी और अंग्रेजी में सीधे बात करने के लिए आपके कैमरे का उपयोग करता है।
              </p>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>निजी डेटा पूरी तरह सुरक्षित है (Privacy First)</span>
              </div>

              {/* Actions */}
              <div className="mt-6 w-full flex flex-col gap-2.5">
                <button
                  disabled={isRequesting}
                  onClick={handleGrantPermission}
                  className="w-full py-3.5 px-5 rounded-full bg-gradient-to-r from-[#FF671F] via-[#FF8833] to-[#046A38] hover:opacity-95 active:scale-[0.98] text-white text-sm font-semibold tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition"
                >
                  <span>{isRequesting ? 'कैमरा शुरू हो रहा है...' : 'कैमरा चालू करें और जुड़ें'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => router.push('/app')}
                  className="w-full py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition"
                >
                  डेमो मोड से जारी रखें (Enter Demo Mode)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
