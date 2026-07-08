/**
 * Text-to-Speech utility.
 * Primary: Puter.js (high quality) — works silently if user has Puter session.
 * Fallback: Web Speech API — picks the best available en-US voice.
 * No login popup is ever shown to students.
 */

declare global {
  interface Window {
    puter?: {
      ai: {
        txt2speech: (text: string) => Promise<HTMLAudioElement>;
      };
      auth?: {
        isSignedIn: () => Promise<boolean>;
      };
    };
  }
}

// ---- Puter TTS (silent, no popup) ----

let puterStatus: "unknown" | "ready" | "unavailable" = "unknown";

const initPuter = async (): Promise<void> => {
  if (puterStatus !== "unknown") return;
  try {
    if (!window.puter?.ai?.txt2speech) {
      puterStatus = "unavailable";
      return;
    }
    // Only use Puter if user already has a session (no popup)
    const isSignedIn = await window.puter.auth?.isSignedIn?.();
    if (isSignedIn) {
      // Verify TTS actually works with a silent test
      await window.puter.ai.txt2speech(" ");
      puterStatus = "ready";
      console.log("Puter TTS: ready (user signed in)");
    } else {
      puterStatus = "unavailable";
      console.log("Puter TTS: skipped (no session, using Web Speech API)");
    }
  } catch {
    puterStatus = "unavailable";
    console.log("Puter TTS: unavailable, falling back to Web Speech API");
  }
};

const speakPuter = async (text: string): Promise<void> => {
  try {
    const audio = await window.puter!.ai.txt2speech(text);
    audio.play();
  } catch (err) {
    console.warn("Puter TTS failed, falling back:", err);
    puterStatus = "unavailable";
    speakWebSpeech(text);
  }
};

// ---- Web Speech API (smart voice selection) ----

// Ranked voice preferences: best quality first
const PREFERRED_VOICES = [
  "Google US English",        // Chrome desktop — very natural
  "Microsoft Aria Online",    // Edge — neural quality
  "Microsoft Jenny Online",   // Edge — neural quality
  "Samantha",                 // macOS/iOS — high quality
  "Karen",                    // macOS/iOS
  "Daniel",                   // macOS/iOS
  "Google UK English Female", // Chrome — good fallback
  "Google UK English Male",
];

let bestVoice: SpeechSynthesisVoice | null = null;
let voiceResolved = false;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
  });
};

const resolveBestVoice = async (): Promise<SpeechSynthesisVoice | null> => {
  if (voiceResolved) return bestVoice;
  const all = await loadVoices();
  const enVoices = all.filter(
    (v) => v.lang.startsWith("en-US") || v.lang === "en_US" || v.lang.startsWith("en-GB") || v.lang.startsWith("en"),
  );

  // Try preferred voices in order
  for (const name of PREFERRED_VOICES) {
    const match = enVoices.find((v) => v.name.includes(name));
    if (match) { bestVoice = match; break; }
  }

  // Fallback: prefer any en-US voice, then any en voice
  if (!bestVoice) {
    bestVoice = enVoices.find((v) => v.lang.startsWith("en-US")) || enVoices[0] || null;
  }

  voiceResolved = true;
  if (bestVoice) console.log(`Web Speech API voice: ${bestVoice.name} (${bestVoice.lang})`);
  return bestVoice;
};

const speakWebSpeech = async (text: string, rate = 0.85): Promise<void> => {
  speechSynthesis.cancel();
  const voice = await resolveBestVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
};

// ---- Language detection ----

// Vietnamese-specific diacritical characters not found in other Latin languages.
// The `g` flag is required — without it String.match returns only the first
// match, so the count below could never reach the >= 2 threshold. (String.match
// with a global regex is stateless across calls, so reuse here is safe.)
const viCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;

/** Returns true if text is primarily Vietnamese (>= 2 Vietnamese diacritics). */
const isVietnamese = (text: string): boolean =>
  (text.match(viCharRegex) || []).length >= 2;

/**
 * Prepare text for an English TTS voice. Drops Vietnamese fragments so only the
 * English part is read aloud:
 *   - parenthetical glosses that contain Vietnamese, e.g. "(màu xanh dương)"
 *   - a leading question number, e.g. "1. " / "12) "
 * Returns "" when what remains is still primarily Vietnamese (nothing English
 * worth reading) — e.g. a pure Vietnamese instruction line.
 */
const sanitizeForSpeech = (text: string): string => {
  const cleaned = text
    .replace(/\s*\([^)]*\)/g, (m) => (isVietnamese(m) ? " " : m))
    .replace(/^\s*\d+\s*[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  return isVietnamese(cleaned) ? "" : cleaned;
};

// ---- Public API ----

// Eagerly init on load (no popup, no blocking)
if (typeof window !== "undefined") {
  setTimeout(initPuter, 1000);
}

/**
 * Speak text using best available engine.
 * Puter TTS if user has session, otherwise Web Speech API with best voice.
 */
export const speakUS = async (text: string, rate = 0.85): Promise<void> => {
  // Read only the English part; an English voice cannot pronounce Vietnamese.
  const speakText = sanitizeForSpeech(text);
  if (!speakText) return;

  speechSynthesis.cancel();
  if (puterStatus === "unknown") await initPuter();
  if (puterStatus === "ready") {
    await speakPuter(speakText);
  } else {
    await speakWebSpeech(speakText, rate);
  }
};

/**
 * Immediate speak (non-async, for click handlers).
 */
export const speakImmediate = (text: string, rate = 0.85): void => {
  speakUS(text, rate);
};
