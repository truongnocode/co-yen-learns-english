/**
 * Text-to-Speech utility.
 * Primary: Puter.js (high quality, natural US voice) — requires one-time Puter login.
 * Fallback: Web Speech API (browser built-in) — uses random en-US voice.
 */

declare global {
  interface Window {
    puter?: {
      ai: {
        txt2speech: (text: string) => Promise<HTMLAudioElement>;
      };
    };
  }
}

let puterAvailable: boolean | null = null; // null = not checked yet

const checkPuter = (): boolean => {
  if (puterAvailable !== null) return puterAvailable;
  puterAvailable = !!(window.puter?.ai?.txt2speech);
  return puterAvailable;
};

// ---- Puter TTS ----
const speakPuter = async (text: string): Promise<void> => {
  try {
    const audio = await window.puter!.ai.txt2speech(text);
    audio.play();
  } catch (err) {
    console.warn("Puter TTS failed, falling back to Web Speech API:", err);
    puterAvailable = false;
    speakFallback(text);
  }
};

// ---- Web Speech API fallback ----
let usVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
  });
};

const getUSVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (voicesLoaded && usVoices.length > 0) return usVoices;
  const all = await loadVoices();
  usVoices = all.filter((v) => v.lang.startsWith("en-US") || v.lang === "en_US");
  if (usVoices.length === 0) usVoices = all.filter((v) => v.lang.startsWith("en"));
  voicesLoaded = true;
  return usVoices;
};

const speakFallback = async (text: string, rate = 0.85): Promise<void> => {
  speechSynthesis.cancel();
  const voices = await getUSVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  if (voices.length > 0) {
    u.voice = voices[Math.floor(Math.random() * voices.length)];
  }
  speechSynthesis.speak(u);
};

// ---- Public API ----

/**
 * Speak text using Puter (preferred) or Web Speech API (fallback).
 */
export const speakUS = async (text: string, rate = 0.85): Promise<void> => {
  speechSynthesis.cancel();
  if (checkPuter()) {
    await speakPuter(text);
  } else {
    await speakFallback(text, rate);
  }
};

/**
 * Immediate speak (non-async, for click handlers that don't want to await).
 */
export const speakImmediate = (text: string, rate = 0.85): void => {
  speakUS(text, rate);
};
