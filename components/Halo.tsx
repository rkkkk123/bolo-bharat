'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BBox } from '@/store/useBoloStore';

export interface HaloProps {
  bbox: BBox | null;
  isActive: boolean;
  objectName?: string | null;
}

export const Halo: React.FC<HaloProps> = ({ bbox, isActive, objectName }) => {
  if (!isActive || !bbox) return null;

  // Clamped coordinates to guarantee it never renders off-screen
  const safeX = Math.max(1, Math.min(94, bbox.x));
  const safeY = Math.max(1, Math.min(94, bbox.y));
  const safeW = Math.max(6, Math.min(100 - safeX, bbox.w));
  const safeH = Math.max(6, Math.min(100 - safeY, bbox.h));

  return (
    <AnimatePresence>
      <motion.div
        key="bolo-halo"
        initial={{
          scale: 0.85,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.85,
          opacity: 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 26,
        }}
        style={{
          top: `${safeY}%`,
          left: `${safeX}%`,
          width: `${safeW}%`,
          height: `${safeH}%`,
          willChange: 'transform, opacity',
        }}
        className="absolute pointer-events-none z-30 flex flex-col"
      >
        {/* Label pill above halo: objectName + live Indian Flag green dot */}
        <motion.div
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.2 }}
          className="absolute -top-10 left-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-white text-xs font-semibold shadow-xl border border-white/20 select-none whitespace-nowrap"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span>{objectName || 'पहचाना गया'}</span>
          <span className="text-[10px] text-white/50 font-normal">bol raha hai</span>
        </motion.div>

        {/* Halo Body: 24px border with inner glow box-shadow and subtle tricolor glass tint */}
        <div
          style={{
            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.45), 0 0 24px rgba(255, 103, 31, 0.2)',
          }}
          className="w-full h-full border-2 border-white/90 bg-white/10 backdrop-blur-md rounded-[24px]"
        />

        {/* Delicate corner anchors for visual grounding */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#FF671F] rounded-tl-sm" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#FF671F] rounded-tr-sm" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#046A38] rounded-bl-sm" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#046A38] rounded-br-sm" />
      </motion.div>
    </AnimatePresence>
  );
};
