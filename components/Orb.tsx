'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { TricolorOrb } from './TricolorOrb';

export interface OrbProps {
  onClick?: () => void;
}

export const Orb: React.FC<OrbProps> = ({ onClick }) => {
  const { status, isTalking } = useBoloStore();

  const isGrounding = status === 'GROUNDING';
  const isListeningOrTalking = status === 'TALKING' || isTalking;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-40 flex flex-col items-center justify-center pointer-events-auto select-none [bottom:max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))]">
      {/* Waveform visualizer above orb during listening/talking state */}
      {isListeningOrTalking && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="mb-3 flex items-center justify-center gap-1.5 h-6 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 shadow-xl"
        >
          {[10, 20, 14, 24, 12, 22, 16].map((_, idx) => (
            <motion.div
              key={idx}
              animate={{
                scaleY: [0.3, 1.3, 0.4],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.7 + (idx % 3) * 0.15,
                ease: 'easeInOut',
              }}
              className="w-1 bg-gradient-to-t from-[#FF671F] via-white to-[#046A38] rounded-full h-full origin-bottom"
            />
          ))}
        </motion.div>
      )}

      {/* Tricolor Wave Action Orb (68px) with safe accessible touch */}
      <div className="relative p-1">
        <TricolorOrb
          size={68}
          isPulsing={isGrounding || isListeningOrTalking}
          onClick={onClick}
          showAura={true}
        />
      </div>
    </div>
  );
};
