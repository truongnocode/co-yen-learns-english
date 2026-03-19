/**
 * Text-to-Speech utility with random American English male/female voices.
 * Uses the Web Speech API (SpeechSynthesis).
 */

let voicesLoaded = false;
let usVoices: SpeechSynthesisVoice[] = [];

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };
    // Fallback timeout
    setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
  });
};

const getUSVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (voicesLoaded && usVoices.length > 0) return usVoices;
  const all = await loadVoices();
  // Prefer en-US voices
  usVoices = all.filter((v) => v.lang.startsWith("en-US") || v.lang === "en_US");
  // Fallback to any English voice
  if (usVoices.length === 0) {
    usVoices = all.filter((v) => v.lang.startsWith("en"));
  }
  voicesLoaded = true;
  return usVoices;
};

/**
 * Speak text in American English with a random voice (alternating male/female).
 * Returns a function to replay the same utterance.
 */
export const speakUS = async (text: string, rate = 0.85): Promise<void> => {
  speechSynthesis.cancel(); // Stop any ongoing speech
  const voices = await getUSVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  if (voices.length > 0) {
    // Pick a random voice for variety (male/female)
    u.voice = voices[Math.floor(Math.random() * voices.length)];
  }
  speechSynthesis.speak(u);
};

/**
 * Simple speak without async voice loading (immediate, uses whatever voice is available).
 */
export const speakImmediate = (text: string, rate = 0.85): void => {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en-US") || v.lang === "en_US");
  if (voices.length > 0) {
    u.voice = voices[Math.floor(Math.random() * voices.length)];
  }
  speechSynthesis.speak(u);
};
