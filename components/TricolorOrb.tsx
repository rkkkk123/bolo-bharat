'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TricolorOrbProps {
  size?: number; // Size in pixels
  isPulsing?: boolean;
  onClick?: () => void;
  className?: string;
  showAura?: boolean;
}

export const TricolorOrb: React.FC<TricolorOrbProps> = ({
  size = 150,
  isPulsing = false,
  onClick,
  className = '',
  showAura = true,
}) => {
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center cursor-pointer select-none group ${className}`}
    >
      {/* 1. Outer Multi-Stage Radiant Lighting (Clean, luminous corona) */}
      {showAura && (
        <>
          {/* Deep Ambient Tricolor Flare */}
          <motion.div
            animate={{
              scale: isPulsing ? [1, 1.25, 1] : [1, 1.12, 1],
              opacity: isPulsing ? [0.65, 0.9, 0.65] : [0.45, 0.7, 0.45],
            }}
            transition={{
              duration: isPulsing ? 1.6 : 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: size * 1.55, height: size * 1.55 }}
            className="absolute rounded-full pointer-events-none blur-3xl bg-[radial-gradient(circle,#FF671F_0%,rgba(255,255,255,0.4)_40%,#046A38_75%,transparent_100%)] opacity-60"
          />

          {/* Focused Mid-Rim Luminous Corona */}
          <motion.div
            animate={{
              scale: isPulsing ? [1.02, 1.15, 1.02] : [1, 1.06, 1],
              opacity: isPulsing ? [0.75, 1, 0.75] : [0.6, 0.85, 0.6],
              rotate: [0, 360],
            }}
            transition={{
              scale: { duration: isPulsing ? 1.6 : 3, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: isPulsing ? 1.6 : 3, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
            }}
            style={{ width: size * 1.22, height: size * 1.22 }}
            className="absolute rounded-full pointer-events-none blur-xl bg-[conic-gradient(from_0deg,#FF671F,#FFFFFF,#046A38,#0A1172,#FF671F)] opacity-70"
          />

          {/* Close-Glow Rim Light */}
          <div
            style={{
              width: size * 1.05,
              height: size * 1.05,
              boxShadow:
                '0 0 32px rgba(255, 103, 31, 0.6), 0 0 45px rgba(4, 106, 56, 0.5), 0 0 20px rgba(255, 255, 255, 0.8)',
            }}
            className="absolute rounded-full pointer-events-none opacity-80"
          />
        </>
      )}

      {/* 2. Master 3D Glass Sphere Body */}
      <motion.div
        animate={{
          scale: isPulsing ? [1, 1.08, 1] : [1, 1.025, 1],
        }}
        transition={{
          duration: isPulsing ? 1.5 : 3.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        style={{
          width: size,
          height: size,
          boxShadow:
            'inset 0 3px 6px rgba(255, 255, 255, 0.9), inset 0 -6px 16px rgba(0, 0, 0, 0.5), 0 16px 36px rgba(0, 0, 0, 0.45)',
        }}
        className="relative rounded-full overflow-hidden border-[1.5px] border-white/60 backdrop-blur-md"
      >
        {/* Base Layer: Rich, Highly Saturated 3-Band Flag Foundation */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Top 35%: Vibrant Saffron */}
          <div className="h-[35%] w-full bg-gradient-to-b from-[#FF5500] via-[#FF671F] to-[#FF8822]" />
          {/* Middle 30%: Luminous Pure White with subtle Ashok Blue aura */}
          <div className="h-[30%] w-full bg-gradient-to-b from-[#FAF9F6] via-[#FFFFFF] to-[#F0FDF4] relative flex items-center justify-center">
            {/* Subtle Ashok Navy Center Heart Glow */}
            <div className="w-1/2 h-full rounded-full bg-[radial-gradient(circle,rgba(0,0,128,0.2)_0%,rgba(10,17,114,0.1)_45%,transparent_75%)]" />
          </div>
          {/* Bottom 35%: Lush Vibrant India Green */}
          <div className="h-[35%] w-full bg-gradient-to-b from-[#058844] via-[#046A38] to-[#024E28]" />
        </div>

        {/* 3. Fluid Wave Layer 1: Seamless Saffron Sine Waves (Undulating Top Boundary) */}
        <motion.div
          animate={{
            x: ['0%', '-50%'],
          }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-[12%] -left-[10%] w-[300%] h-[68%] pointer-events-none opacity-95"
        >
          <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="kesariyaWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF5500" stopOpacity="1" />
                <stop offset="65%" stopColor="#FF771F" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FF9933" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <path
              d="M0,170 C150,130 250,210 400,165 C550,120 650,205 800,165 C950,125 1050,210 1200,170 L1200,0 L0,0 Z"
              fill="url(#kesariyaWaveGrad)"
            />
          </svg>
        </motion.div>

        {/* Counter-Harmonic Saffron Mist (Creates depth between waves) */}
        <motion.div
          animate={{
            x: ['-50%', '0%'],
            y: ['0%', '-6%', '0%'],
          }}
          transition={{
            x: { duration: 8.5, repeat: Infinity, ease: 'linear' },
            y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute -top-[6%] -left-[10%] w-[300%] h-[58%] pointer-events-none opacity-50 mix-blend-screen"
        >
          <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,140 C180,185 280,110 400,145 C520,180 680,115 800,145 C920,175 1080,115 1200,140 L1200,0 L0,0 Z"
              fill="#FFA844"
            />
          </svg>
        </motion.div>

        {/* 4. Fluid Wave Layer 2: Radiant Center White Wave Current */}
        <motion.div
          animate={{
            scaleY: [0.9, 1.15, 0.9],
            x: ['-25%', '0%', '-25%'],
          }}
          transition={{
            scaleY: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            x: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute top-[28%] -left-[20%] w-[180%] h-[42%] pointer-events-none opacity-85 mix-blend-overlay flex items-center justify-center"
        >
          <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,1)_0%,rgba(240,245,255,0.7)_50%,transparent_85%)] blur-[2px]" />
        </motion.div>

        {/* 5. Fluid Wave Layer 3: Seamless India Green Sine Waves (Undulating Bottom Boundary) */}
        <motion.div
          animate={{
            x: ['-50%', '0%'],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-[12%] -left-[10%] w-[300%] h-[68%] pointer-events-none opacity-95"
        >
          <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="greenWaveGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#024E28" stopOpacity="1" />
                <stop offset="60%" stopColor="#046A38" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <path
              d="M0,130 C150,170 250,90 400,135 C550,180 650,95 800,135 C950,175 1050,90 1200,130 L1200,300 L0,300 Z"
              fill="url(#greenWaveGrad)"
            />
          </svg>
        </motion.div>

        {/* Counter-Harmonic Emerald Green Mist */}
        <motion.div
          animate={{
            x: ['0%', '-50%'],
            y: ['0%', '5%', '0%'],
          }}
          transition={{
            x: { duration: 9, repeat: Infinity, ease: 'linear' },
            y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute -bottom-[6%] -left-[10%] w-[300%] h-[58%] pointer-events-none opacity-45 mix-blend-screen"
        >
          <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,160 C180,115 280,190 400,155 C520,120 680,185 800,155 C920,125 1080,185 1200,160 L1200,300 L0,300 Z"
              fill="#34D399"
            />
          </svg>
        </motion.div>

        {/* 6. Industry-Grade Specular 3D Optics (Apple / Meta Keynote Glass Aesthetics) */}
        {/* Crisp Top Specular Arc Glare */}
        <div className="absolute top-1.5 inset-x-4 h-[44%] rounded-t-full bg-gradient-to-b from-white/85 via-white/25 to-transparent pointer-events-none blur-[0.4px]" />

        {/* Secondary Focal Dot Specular (Top-Left 3D Glint) */}
        <div className="absolute top-3 left-4 w-4 h-3 rounded-full bg-white/90 blur-[0.6px] pointer-events-none transform -rotate-12" />

        {/* Bottom Ambient Caustic Reflection */}
        <div className="absolute bottom-2 inset-x-6 h-[22%] rounded-b-full bg-gradient-to-t from-white/45 via-white/10 to-transparent pointer-events-none blur-[1px]" />

        {/* Internal 3D Rim Bevel */}
        <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.3)]" />
      </motion.div>
    </div>
  );
};
