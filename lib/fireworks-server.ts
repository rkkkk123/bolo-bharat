/**
 * Fireworks AI Server Client — Shared Factory
 * Single source of truth for credentials & model configuration.
 * Vercel-safe: uses process.env only (no fs reads).
 */

import OpenAI from 'openai';

// ─── Verified Active Model Registry ──────────────────────────────────────────
// Deployed models on Fireworks account + Meta Llama fallbacks
export const MODELS = {
  /** Multimodal Vision Grounding: fast, accurate visual localization on base64 frames */
  VISION: 'accounts/fireworks/models/qwen3p8-max',
  VISION_FALLBACK: 'accounts/fireworks/models/qwen3p8-2p4t-a95b',
  META_VISION: 'accounts/fireworks/models/llama-v3p2-90b-vision-instruct',

  /** Persona Dialogue: ultra-fast, witty Hinglish object dialogue */
  DIALOGUE: 'accounts/fireworks/models/minimax-m3p1-flash',
  DIALOGUE_FALLBACK: 'accounts/fireworks/models/qwen3p8-max',
  META_DIALOGUE: 'accounts/fireworks/models/llama4-maverick-instruct-basic',

  /** Classical Structured Repair Planning: high-accuracy JSON reasoning */
  PLANNING: 'accounts/fireworks/models/minimax-m3p1-flash',
  PLANNING_30B: 'accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b',
  PLANNING_MUSE: 'accounts/fireworks/models/muse-spark-open',
  META_PLANNING: 'accounts/fireworks/models/llama4-scout-instruct-basic',
} as const;

// ─── Timeouts (milliseconds) ─────────────────────────────────────────────────
export const TIMEOUTS = {
  VISION: 20000,
  DIALOGUE: 15000,
  PLANNING: 15000,
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
