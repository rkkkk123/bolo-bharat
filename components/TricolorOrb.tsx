'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export interface TricolorOrbProps {
  /** Diameter in pixels */
  size?: number;
  /** Whether the orb is currently pulsing (e.g. listening / speaking / active) */
  isPulsing?: boolean;
  /** Click / tap handler */
  onClick?: () => void;
  /** Optional extra classes */
  className?: string;
  /** Whether to render the ambient glowing aura behind the orb */
  showAura?: boolean;
}

/**
 * World-Class 3D Glass Tricolor Orb (Tiranga)
 * - 100% vector-clipped circle (guaranteed zero square artifacts on any iOS / Android / Desktop browser)
 * - Silky-smooth hardware-accelerated continuous liquid wave motion
 * - Deep 3D volumetric glass sphere shading (inner depth, caustic uplight, top specular glare)
 * - Radiant Ashok Chakra navy core with 24-ray mandala resonance
 * - Multi-layered breathing aura with saffron and emerald corona
 */
export const TricolorOrb: React.FC<TricolorOrbProps> = ({
  size = 170,
  isPulsing = false,
  onClick,
  className = '',
  showAura = true,
}) => {
  const rawId = useId();
  // Safe sanitized ID for SVG defs
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const clipId = `orbCircleClip_${id}`;
  const saffronGradId = `saffronGrad_${id}`;
  const greenGradId = `greenGrad_${id}`;
  const whiteGradId = `whiteGrad_${id}`;
  const sphereDepthId = `sphereDepth_${id}`;
  const specularGradId = `specularGrad_${id}`;
  const causticGradId = `causticGrad_${id}`;
  const rimGradId = `rimGrad_${id}`;
  const chakraCoreId = `chakraCore_${id}`;
  const swirlGradId = `swirlGrad_${id}`;

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center cursor-pointer select-none group touch-manipulation ${className}`}
      role="button"
      tabIndex={0}
      aria-label="World-Class Tricolor AI Orb - Tap to Begin"
    >
      {/* 1. Ultra-Smooth Breathing Aura (Outer Corona) */}
      {showAura && (
        <>
          {/* Broad Ambient Chromatic Halo (Saffron & Emerald) */}
          <motion.div
            animate={{
              scale: isPulsing ? [1, 1.25, 1] : [1, 1.12, 1],
              opacity: isPulsing ? [0.75, 0.95, 0.75] : [0.55, 0.75, 0.55],
              rotate: [0, 360],
            }}
            transition={{
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 32, repeat: Infinity, ease: 'linear' },
            }}
            style={{
              width: size * 1.55,
              height: size * 1.55,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,103,31,0.65) 0%, rgba(255,255,255,0.4) 40%, rgba(4,106,56,0.55) 75%, transparent 100%)',
              filter: 'blur(34px)',
            }}
            className="absolute pointer-events-none -z-10"
          />

          {/* Golden Sun & Emerald Caustic Ring */}
          <motion.div
            animate={{
              scale: isPulsing ? [1.04, 1.18, 1.04] : [1, 1.07, 1],
              opacity: [0.55, 0.8, 0.55],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: size * 1.22,
              height: size * 1.22,
              borderRadius: '50%',
              boxShadow:
                '0 0 45px rgba(255, 103, 31, 0.55), 0 0 60px rgba(4, 106, 56, 0.45)',
            }}
            className="absolute pointer-events-none -z-10"
          />
        </>
      )}

      {/* 2. Floating Master Sphere Wrapper */}
      <motion.div
        animate={{
          y: [-4, 4, -4],
          scale: isPulsing ? [1, 1.05, 1] : [1, 1.015, 1],
        }}
        transition={{
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center transition-transform"
      >
        {/* 3. Pure Vector-Clipped 3D Sphere (World-Class Fluid SVG) */}
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          className="w-full h-full block drop-shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
          style={{ overflow: 'hidden' }}
        >
          <defs>
            {/* Absolute Circular Clip (Radius 98) */}
            <clipPath id={clipId}>
              <circle cx="100" cy="100" r="97" />
            </clipPath>

            {/* Radiant Kesariya (Indian Saffron) Gradient */}
            <linearGradient id={saffronGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF4600" />
              <stop offset="55%" stopColor="#FF671F" />
              <stop offset="100%" stopColor="#FFA64D" />
            </linearGradient>

            {/* Pristine Luminous White Gradient */}
            <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF9" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F5FCF7" />
            </linearGradient>

            {/* Lush Emerald Green Gradient */}
            <linearGradient id={greenGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B964E" />
              <stop offset="50%" stopColor="#046A38" />
              <stop offset="100%" stopColor="#013B1F" />
            </linearGradient>

            {/* Ashok Chakra Core Glow */}
            <radialGradient id={chakraCoreId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000080" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#0A1172" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#000080" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000080" stopOpacity="0" />
            </radialGradient>

            {/* 3D Volumetric Depth Vignette (Simulates Spherical Curvature) */}
            <radialGradient id={sphereDepthId} cx="42%" cy="38%" r="62%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="88%" stopColor="#000000" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
            </radialGradient>

            {/* Apple 3D Specular Upper Arc */}
            <linearGradient id={specularGradId} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Caustic Bottom Glow */}
            <linearGradient id={causticGradId} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Liquid Swirl Gradient */}
            <linearGradient id={swirlGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FF9933" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
            </linearGradient>

            {/* 3D Glass Outer Rim Bevel Gradient */}
            <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Master Graphics Enclosed in Vector Clip */}
          <g clipPath={`url(#${clipId})`}>
            {/* === LAYER 1: Base Tricolor Bands === */}
            {/* Top 37%: Saffron */}
            <rect x="0" y="0" width="200" height="75" fill={`url(#${saffronGradId})`} />

            {/* Middle 26%: Pure White */}
            <rect x="0" y="75" width="200" height="52" fill={`url(#${whiteGradId})`} />

            {/* Bottom 37%: Emerald Green */}
            <rect x="0" y="127" width="200" height="73" fill={`url(#${greenGradId})`} />

            {/* === LAYER 2: Smooth Liquid Waves (Continuous Hardware Acceleration) === */}
            {/* Saffron Primary Fluid Wave (Top-to-Middle Boundary) */}
            <g opacity="0.95">
              <path
                d="M-400,72 C-350,56 -300,82 -250,70 C-200,58 -150,84 -100,68 C-50,52 0,80 50,66 C100,52 150,82 200,68 C250,54 300,82 350,68 C400,54 450,82 500,68 C550,54 600,82 650,68 L650,0 L-400,0 Z"
                fill={`url(#${saffronGradId})`}
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0,0"
                  to="-300,0"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            {/* Saffron Secondary Counter-Harmonic Wave (Adds realistic liquid layering) */}
            <g opacity="0.45" style={{ mixBlendMode: 'screen' }}>
              <path
                d="M-400,64 C-330,78 -270,50 -200,66 C-130,82 -70,52 0,68 C70,84 130,54 200,70 C270,86 330,56 400,72 C470,88 530,58 600,72 L600,0 L-400,0 Z"
                fill="#FFAE52"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="-300,0"
                  to="0,0"
                  dur="8.5s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            {/* India Green Primary Fluid Wave (Middle-to-Bottom Boundary) */}
            <g opacity="0.95">
              <path
                d="M-400,128 C-350,144 -300,118 -250,132 C-200,146 -150,120 -100,134 C-50,148 0,122 50,136 C100,150 150,124 200,138 C250,152 300,126 350,140 C400,154 450,128 500,142 C550,156 600,130 650,144 L650,200 L-400,200 Z"
                fill={`url(#${greenGradId})`}
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="-300,0"
                  to="0,0"
                  dur="6.8s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            {/* India Green Secondary Counter-Harmonic Wave */}
            <g opacity="0.4" style={{ mixBlendMode: 'screen' }}>
              <path
                d="M-400,136 C-330,120 -270,148 -200,132 C-130,116 -70,144 0,128 C70,112 130,140 200,124 C270,108 330,138 400,122 C470,106 530,136 600,120 L600,200 L-400,200 Z"
                fill="#34D399"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0,0"
                  to="-300,0"
                  dur="9s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            {/* === LAYER 3: Ashok Chakra Core in White Center === */}
            <circle cx="100" cy="100" r="26" fill={`url(#${chakraCoreId})`} />
            {/* 24-spoke Ashok Chakra Geometric Mandala */}
            <g opacity="0.65">
              <circle
                cx="100"
                cy="100"
                r="11"
                fill="none"
                stroke="#0A1172"
                strokeWidth="0.8"
                strokeDasharray="1.4 1.4"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 100 100"
                  to="360 100 100"
                  dur="40s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Chakra inner hub & outer ring */}
              <circle cx="100" cy="100" r="4" fill="none" stroke="#000080" strokeWidth="0.7" />
              <circle cx="100" cy="100" r="1.8" fill="#000080" />
            </g>

            {/* === LAYER 4: Rotating Organic Liquid Swirl Overlay === */}
            <g opacity="0.32" style={{ mixBlendMode: 'overlay' }}>
              <ellipse cx="100" cy="100" rx="92" ry="28" fill={`url(#${swirlGradId})`}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 100 100"
                  to="360 100 100"
                  dur="16s"
                  repeatCount="indefinite"
                />
              </ellipse>
            </g>

            {/* === LAYER 5: 3D Volumetric Spherical Shading === */}
            {/* Gives real physical sphere volume and mass */}
            <rect x="0" y="0" width="200" height="200" fill={`url(#${sphereDepthId})`} />

            {/* === LAYER 6: Apple-Grade 3D Glass Surface Optics === */}
            {/* Top Curvature Specular Glare Arc */}
            <path
              d="M24,84 C30,42 62,18 100,18 C138,18 170,42 176,84 C152,56 128,44 100,44 C72,44 48,56 24,84 Z"
              fill={`url(#${specularGradId})`}
            />

            {/* Primary Studio Softbox Reflection Glint (Top-Left) */}
            <ellipse
              cx="62"
              cy="48"
              rx="13"
              ry="8.5"
              transform="rotate(-28 62 48)"
              fill="#FFFFFF"
              opacity="0.94"
            />

            {/* Secondary Micro Pinpoint Star Glint */}
            <circle cx="50" cy="38" r="3" fill="#FFFFFF" opacity="0.98" />

            {/* Bottom Caustic Reflection Glare */}
            <ellipse
              cx="100"
              cy="176"
              rx="56"
              ry="11"
              fill={`url(#${causticGradId})`}
            />
          </g>

          {/* === LAYER 7: 3D Outer Glass Rim Bevel Stroke === */}
          <circle
            cx="100"
            cy="100"
            r="97"
            fill="none"
            stroke={`url(#${rimGradId})`}
            strokeWidth="2.4"
          />
        </svg>
      </motion.div>
    </div>
  );
};
