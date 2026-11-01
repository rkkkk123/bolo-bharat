/**
 * Web Speech Synthesis Engine for BOLO
 * High-clarity voice output in Hindi / Hinglish with iOS Safari unlock.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

// Pre-load available system voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Prime audio context / speech synthesizer during direct user touch/click interaction.
 * Crucial for iOS Safari which requires an active audio unlock during user gesture.
 */
export function primeSpeechSynthesis() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.resume();
    // Silent single-character utterance unlocks iOS audio session
    const unlockUtterance = new SpeechSynthesisUtterance(' ');
    unlockUtterance.volume = 0.01;
    unlockUtterance.rate = 1.0;
    window.speechSynthesis.speak(unlockUtterance);
  } catch {}
}

/**
 * Immediately speaks the given text out loud in Hindi / Hinglish.
 */
export function speakImmediate(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
    callbacks?.onEnd?.();
    return;
  }

  try {
    const synth = window.speechSynthesis;
    synth.cancel(); // Stop any previous ongoing speech
    synth.resume(); // Ensure synthesizer is unpaused

    const utterance = new SpeechSynthesisUtterance(text);

    // Pick best available voice (Hindi -> Indian English -> Default)
    const voices = cachedVoices.length > 0 ? cachedVoices : synth.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
    );
    const indianVoice = voices.find(
      (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
    );
    const fallbackVoice = voices.find(
      (v) => v.default || v.lang.startsWith('en')
    );

    const chosenVoice = hindiVoice || indianVoice || fallbackVoice;
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = 'hi-IN';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[BOLO Speech Warning]', e);
      callbacks?.onEnd?.();
      callbacks?.onError?.(e);
    };

    synth.speak(utterance);
  } catch (err) {
    console.warn('[BOLO Speech Execution Warning]', err);
    callbacks?.onEnd?.();
  }
}

/**
 * Stop any active speech immediately
 */
export function stopSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
}
