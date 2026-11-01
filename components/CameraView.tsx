'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from '@/hooks/useCamera';
import { useBoloStore } from '@/store/useBoloStore';
import { primeSpeechSynthesis } from '@/lib/speech';
import { Camera, RefreshCw } from 'lucide-react';

export interface CameraViewProps {
  onTap?: (point: { x: number; y: number }, imageBase64?: string) => void;
  children?: React.ReactNode;
}

interface Ripple {
  id: number;
  pixelX: number;
  pixelY: number;
}

export const CameraView: React.FC<CameraViewProps> = ({ onTap, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { videoRef, isActive, startCamera, toggleFacingMode } = useCamera();
  const { setTapPoint, setStatus } = useBoloStore();
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Capture tap coordinates, extract video frame, trigger store, and dispatch 60fps GPU ripple
  const handleSurfaceTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Pixel coordinates relative to container (for 60fps transform: translate3d)
      const pixelX = e.clientX - rect.left;
      const pixelY = e.clientY - rect.top;

      // Percentage coordinates (0 - 100)
      const pctX = Math.round((pixelX / rect.width) * 100);
      const pctY = Math.round((pixelY / rect.height) * 100);

      // Call store & set state to GROUNDING
      setTapPoint({ x: pctX, y: pctY });
      setStatus('GROUNDING');
      primeSpeechSynthesis();

      // Add TapRipple
      const rippleId = Date.now();
      setRipples((prev) => [...prev.slice(-3), { id: rippleId, pixelX, pixelY }]);

      // Capture frame from active video element
      let capturedFrameBase64 = '';
      if (videoRef.current && isActive && videoRef.current.videoWidth > 0) {
        try {
          const video = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(800, video.videoWidth);
          canvas.height = Math.min(800, video.videoHeight);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            capturedFrameBase64 = canvas.toDataURL('image/jpeg', 0.8);
          }
        } catch (captureErr) {
          console.warn('[BOLO Frame Capture Warning]', captureErr);
        }
      }

      // Notify parent if provided
      if (onTap) {
        onTap({ x: pctX, y: pctY }, capturedFrameBase64);
      }
    },
    [setTapPoint, setStatus, onTap, videoRef, isActive]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleSurfaceTap}
      className="relative w-full h-full rounded-[36px] overflow-hidden bg-black flex items-center justify-center select-none cursor-crosshair shadow-2xl border border-white/10"
    >
      {/* 1. Permanent Video Feed element (Guaranteed to fill viewport) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover rounded-[36px] transition-opacity duration-300 z-10 ${
          isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Interactive Workspace Mock Surface (Shown when live camera is loading or permission pending) */}
      {!isActive && (
        <div className="absolute inset-0 w-full h-full object-cover bg-gradient-to-br from-[#0E1017] via-[#090A0E] to-black flex items-center justify-center rounded-[36px] z-0">
          <div className="relative w-full h-full max-w-sm mx-auto overflow-hidden pointer-events-none opacity-85">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,103,31,0.14),transparent_70%)]" />

            {/* Coffee Mug Zone */}
            <div className="absolute top-[26%] left-[18%] w-32 h-36 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-3xl mb-1">☕</span>
              <span className="text-white text-xs font-semibold">Coffee Mug</span>
              <span className="text-white/40 text-[10px]">कॉफी मग</span>
            </div>

            {/* Smart Watch Zone */}
            <div className="absolute top-[32%] right-[16%] w-28 h-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl mb-1">⌚</span>
              <span className="text-white text-xs font-semibold">Smart Watch</span>
              <span className="text-white/40 text-[10px]">स्मार्ट वॉच</span>
            </div>

            {/* Plant Zone */}
            <div className="absolute top-[10%] right-[22%] w-24 h-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl mb-1">🪴</span>
              <span className="text-white text-xs font-semibold">Plant</span>
              <span className="text-white/40 text-[10px]">पौधा</span>
            </div>

            {/* Notebook Zone */}
            <div className="absolute bottom-[24%] left-[22%] w-48 h-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl mb-1">📖</span>
              <span className="text-white text-xs font-semibold">Notebook</span>
              <span className="text-white/40 text-[10px]">नोटबुक</span>
            </div>
          </div>

          {/* Interactive Start Camera Banner on user click */}
          <div className="absolute top-16 inset-x-4 z-20 flex justify-center pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF671F] via-[#FF8833] to-[#046A38] text-white text-xs font-semibold shadow-lg shadow-orange-500/25 flex items-center gap-2 hover:opacity-95 active:scale-95 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>कैमरा चालू करें (Click to Enable Camera)</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera Flip Button (when active) */}
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFacingMode();
          }}
          className="absolute top-16 right-4 z-30 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/15 transition shadow-lg pointer-events-auto"
          title="Flip camera"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      {/* 60fps TapRipple with Indian Flag Gradient Pulse using GPU transform */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.45,
              ease: 'easeOut',
            }}
            style={{
              transform: `translate3d(${ripple.pixelX}px, ${ripple.pixelY}px, 0)`,
              willChange: 'transform, opacity',
            }}
            className="absolute top-0 left-0 -ml-7 -mt-7 w-14 h-14 rounded-full border-2 border-[#FF671F] bg-gradient-to-tr from-[#FF671F]/30 via-white/20 to-[#046A38]/30 shadow-[0_0_20px_rgba(255,103,31,0.5)] pointer-events-none z-30"
          />
        ))}
      </AnimatePresence>

      {/* Viewport Guides: Delicate 1px white & saffron corner focus markers */}
      <div className="absolute inset-5 pointer-events-none border border-white/5 rounded-[28px] z-20">
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t border-l border-white/70 rounded-tl-sm" />
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t border-r border-white/70 rounded-tr-sm" />
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b border-l border-white/70 rounded-bl-sm" />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b border-r border-white/70 rounded-br-sm" />
      </div>

      {/* Child layers (Halo, etc.) */}
      {children}
    </div>
  );
};
