/**
 * BOLO Design System Tokens
 * Crafted for Meta-grade fluid mobile experiences.
 */

export const tokens = {
  colors: {
    // Core brand & surface palette
    bg: '#FAFAFA',
    card: 'rgba(255, 255, 255, 0.9)',
    metaBlue: '#0084FF',
    metaPurple: '#8B5CF6',
    text: '#0A0A0A',

    // Dark mode counter-tokens
    darkBg: '#090A0F',
    darkCard: 'rgba(20, 22, 28, 0.88)',
    darkText: '#F4F4F5',
    darkBorder: 'rgba(255, 255, 255, 0.1)',

    // Accents & status
    border: 'rgba(0, 0, 0, 0.08)',
    groundingScan: 'rgba(0, 132, 255, 0.25)',
    talkingGlow: 'rgba(139, 92, 246, 0.35)',
    repairAmber: '#F59E0B',
    muted: '#71717A',
    darkMuted: '#A1A1AA',
  },
  radius: {
    card: '32px',
    pill: '999px',
    halo: '24px',
    sm: '12px',
    md: '16px',
    lg: '20px',
  },
  shadow: {
    card: '0 8px 32px rgba(0, 0, 0, 0.06)',
    sheet: '0 -16px 48px rgba(0, 0, 0, 0.12)',
    haloBlue: '0 0 24px rgba(0, 132, 255, 0.35)',
    haloPurple: '0 0 24px rgba(139, 92, 246, 0.4)',
    tapPulse: '0 0 0 12px rgba(0, 132, 255, 0.2)',
  },
  typography: {
    fontFamily: {
      inter: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      hindi: 'Inter, "Noto Sans Devanagari", sans-serif',
    },
    lineHeight: {
      hindi: 1.6,
      normal: 1.5,
      tight: 1.25,
    },
  },
  motion: {
    spring: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
    gentleSpring: {
      type: 'spring' as const,
      stiffness: 220,
      damping: 24,
    },
    snappySpring: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
    },
    haloPulse: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
} as const;

export type DesignTokens = typeof tokens;
