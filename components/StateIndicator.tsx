'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useBoloStore, BoloState } from '@/store/useBoloStore';
import { tokens } from '@/lib/design';

const states: BoloState[] = ['IDLE', 'TAP', 'GROUNDING', 'TALKING', 'REPAIR'];

export const StateIndicator: React.FC = () => {
  const { status } = useBoloStore();

  return (
    <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
      {states.map((st, idx) => {
        const isActive = status === st;
        return (
          <React.Fragment key={st}>
            <motion.div
              layout
              transition={tokens.motion.spring}
              className={`flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-[#0084FF] to-[#8B5CF6] text-white shadow-sm'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span>{st}</span>
            </motion.div>
            {idx < states.length - 1 && (
              <span className="text-white/30 text-[10px]">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
