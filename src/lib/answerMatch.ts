/**
 * Normalize text for answer comparison.
 * - Lowercase
 * - Trim whitespace
 * - Remove trailing punctuation (. ! ? ,)
 * - Collapse multiple spaces into one
 * - Normalize apostrophes (smart quotes → straight)
 */
export const normalizeAnswer = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019\u201C\u201D]/g, (m) =>
      m === "\u2018" || m === "\u2019" ? "'" : '"'
    )
    .replace(/\s+/g, " ")
    .replace(/[.!?,;:]+$/, "")
    .trim();

/**
 * Check if user input matches any of the accepted answers.
 */
export const matchAnswer = (input: string, answers: string[]): boolean =>
  answers.some((a) => normalizeAnswer(a) === normalizeAnswer(input));
