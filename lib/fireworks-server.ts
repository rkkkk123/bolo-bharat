/**
 * Fireworks AI Server Client — Shared Factory
 * Single source of truth for credentials & verified active deployed models.
 * Optimized for AI Meta Developer Hackathon with seamless Meta Llama integration.
 * Vercel-safe: uses process.env only (no fs reads).
 */

import OpenAI from 'openai';

// ─── Model Registry (Meta Llama Primary + Resilient Production Fallbacks) ────
export const MODELS = {
  /** Multimodal Vision Grounding: Meta Llama 3.2 Vision primary, Qwen 3.8 Max fallback */
  META_VISION_11B: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
  META_VISION_90B: 'accounts/fireworks/models/llama-v3p2-90b-vision-instruct',
  VISION_FALLBACK: 'accounts/fireworks/models/qwen3p8-max',

  /** Persona Dialogue: Meta Llama 3.3 70B / 3.1 8B primary, MiniMax M3 Flash fallback */
  META_DIALOGUE_70B: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  META_DIALOGUE_8B: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
  DIALOGUE_FALLBACK: 'accounts/fireworks/models/minimax-m3p1-flash',

  /** Classical Structured Repair Planning: Meta Llama 3.3 70B primary, MiniMax fallback */
  META_PLANNING_70B: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  META_PLANNING_8B: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
  PLANNING_FALLBACK: 'accounts/fireworks/models/minimax-m3p1-flash',
  PLANNING_30B: 'accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b',
} as const;

// ─── Timeouts (milliseconds) ─────────────────────────────────────────────────
export const TIMEOUTS = {
  VISION: 15000,
  DIALOGUE: 10000,
  PLANNING: 12000,
  META_TRY: 3500, // Quick probe for Meta Llama before fallback
} as const;

// ─── Client Factory ──────────────────────────────────────────────────────────
/**
 * Creates an OpenAI-compatible client targeting Fireworks AI.
 * Reads credentials from process.env — works on both local dev and Vercel.
 */
export function createFireworksClient(timeoutMs: number = TIMEOUTS.DIALOGUE): OpenAI {
  const apiKey = process.env.FIREWORKS_API_KEY || '';
  const baseURL = process.env.FIREWORKS_BASE_URL || 'https://api.fireworks.ai/inference/v1';

  if (!apiKey) {
    console.warn('[Fireworks] FIREWORKS_API_KEY not found in process.env');
  }

  return new OpenAI({
    baseURL,
    apiKey,
    timeout: timeoutMs,
  });
}

/**
 * Check if Fireworks API key is configured.
 */
export function hasFireworksKey(): boolean {
  return !!(process.env.FIREWORKS_API_KEY);
}

/**
 * Helper to extract raw buffer from base64 data URL.
 */
export function extractImageBuffer(dataUrl: string): Buffer {
  const commaIdx = dataUrl.indexOf(',');
  const raw = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Buffer.from(raw, 'base64');
}
