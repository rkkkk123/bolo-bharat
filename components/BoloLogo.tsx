'use client';

import React from 'react';

export interface BoloLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show the "भारत" badge */
  showBadge?: boolean;
  /** Optional status text next to or below the logo */
  statusText?: string;
  /** Whether the emblem should have an animated pulse (e.g. while listening/talking) */
  isPulsing?: boolean;
  /** Optional extra classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Render emblem only (without text) */
  iconOnly?: boolean;
}

/**
 * BoloLogo — Official Brand Logo & Emblem for BOLO Bharat
 * - 100% Crisp Vector SVG rendering on any mobile screen (iOS Retina / Android AMOLED)
 * - Authentic 3D Glass Indian Tricolor (Tiranga) sphere with Ashok Chakra core
 * - Perfectly responsive across all mobile phone widths (from 320px to 430px+ and desktop)
 */
export const BoloLogo: React.FC<BoloLogoProps> = ({
  size = 'md',
  showBadge = true,
  statusText,
  isPulsing = false,
  className = '',
  onClick,
  iconOnly = false,
}) => {
  // Dimension tokens based on size variant
  const emblemSizes = {
    sm: 24,
    md: 34,
    lg: 52,
  };

  const emblemSize = emblemSizes[size];

  // SVG Unique gradient IDs using a deterministic prefix
  const saffronId = `logo_saffron_${size}`;
  const whiteId = `logo_white_${size}`;
  const greenId = `logo_green_${size}`;
  const depthId = `logo_depth_${size}`;
  const specularId = `logo_specular_${size}`;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition' : ''
      } ${className}`}
    >
      {/* 1. Indian Tricolor 3D Glass Vector Emblem */}
      <div
        style={{ width: emblemSize, height: emblemSize }}
        className={`relative shrink-0 flex items-center justify-center rounded-full ${
          isPulsing ? 'animate-pulse' : ''
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          width={emblemSize}
          height={emblemSize}
          className="w-full h-full block drop-shadow-[0_2px_8px_rgba(255,103,31,0.35)]"
        >
          <defs>
            <clipPath id={`logoClip_${size}`}>
              <circle cx="50" cy="50" r="48" />
            </clipPath>

            {/* Saffron gradient */}
            <linearGradient id={saffronId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF4600" />
              <stop offset="60%" stopColor="#FF671F" />
              <stop offset="100%" stopColor="#FFA64D" />
            </linearGradient>

            {/* White gradient */}
            <linearGradient id={whiteId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F5FCF7" />
            </linearGradient>

            {/* Green gradient */}
            <linearGradient id={greenId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B964E" />
              <stop offset="50%" stopColor="#046A38" />
              <stop offset="100%" stopColor="#013B1F" />
            </linearGradient>

            {/* 3D Sphere depth vignette */}
            <radialGradient id={depthId} cx="40%" cy="36%" r="62%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="90%" stopColor="#000000" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
            </radialGradient>

            {/* Top glass specular glare */}
            <linearGradient id={specularId} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Clipped Tricolor Bands */}
          <g clipPath={`url(#logoClip_${size})`}>
            {/* Top 37%: Saffron */}
            <rect x="0" y="0" width="100" height="37" fill={`url(#${saffronId})`} />
            {/* Middle 26%: White */}
            <rect x="0" y="37" width="100" height="26" fill={`url(#${whiteId})`} />
            {/* Bottom 37%: Green */}
            <rect x="0" y="63" width="100" height="37" fill={`url(#${greenId})`} />

            {/* Ashok Chakra Navy Core */}
            <circle cx="50" cy="50" r="10" fill="#000080" fillOpacity="0.85" />
            <circle
              cx="50"
              cy="50"
              r="6.5"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeDasharray="1 1"
              opacity="0.8"
            />
            <circle cx="50" cy="50" r="2.2" fill="#FFFFFF" />

            {/* 3D Sphere curvature */}
            <rect x="0" y="0" width="100" height="100" fill={`url(#${depthId})`} />

            {/* Glass Glare */}
            <path
              d="M14,40 C18,20 34,8 50,8 C66,8 82,20 86,40 C74,26 62,20 50,20 C38,20 26,26 14,40 Z"
              fill={`url(#${specularId})`}
            />
            <circle cx="34" cy="24" r="3.5" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* Outer Glass Bevel Rim */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.6"
          />
        </svg>
      </div>

      {/* 2. Brand Typography & Status Pill (unless icon-only) */}
      {!iconOnly && (
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-white font-sans ${
                size === 'sm'
                  ? 'text-xs sm:text-sm'
                  : size === 'md'
                  ? 'text-sm sm:text-base'
                  : 'text-2xl sm:text-3xl'
              }`}
            >
              BOLO
            </span>

            {showBadge && (
              <span
                className={`font-extrabold uppercase rounded-full bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white shadow-sm border border-white/25 leading-none ${
                  size === 'sm'
                    ? 'text-[9px] px-1.5 py-0.5 tracking-wider'
                    : size === 'md'
                    ? 'text-[10px] px-2 py-0.5 tracking-widest'
                    : 'text-xs px-2.5 py-1 tracking-widest'
                }`}
              >
                भारत
              </span>
            )}
          </div>

          {statusText && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
              <span className="text-[11px] font-medium text-neutral-300 font-hindi truncate max-w-[110px] sm:max-w-none">
                {statusText}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
