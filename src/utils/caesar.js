// ─── Caesar Cipher ────────────────────────────────────────────────────────────

/** Encrypt plaintext with shift. Preserves case and non-alpha characters. */
export function encrypt(plaintext, shift) {
  const s = ((shift % 26) + 26) % 26;
  return plaintext.split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') {
      return String.fromCharCode(((ch.charCodeAt(0) - 65 + s) % 26) + 65);
    }
    if (ch >= 'a' && ch <= 'z') {
      return String.fromCharCode(((ch.charCodeAt(0) - 97 + s) % 26) + 97);
    }
    return ch;
  }).join('');
}

/** Decrypt ciphertext with shift. Preserves case and non-alpha characters. */
export function decrypt(ciphertext, shift) {
  return encrypt(ciphertext, -shift);
}

/** English letter frequency percentages (approximate). */
export const ENGLISH_FREQUENCIES = {
  A: 8.2,  B: 1.5,  C: 2.8,  D: 4.3,  E: 12.7, F: 2.2,
  G: 2.0,  H: 6.1,  I: 7.0,  J: 0.15, K: 0.77, L: 4.0,
  M: 2.4,  N: 6.7,  O: 7.5,  P: 1.9,  Q: 0.10, R: 6.0,
  S: 6.3,  T: 9.1,  U: 2.8,  V: 0.98, W: 2.4,  X: 0.15,
  Y: 2.0,  Z: 0.07,
};

/**
 * Compute letter frequency percentages from text.
 * Returns { A: pct, B: pct, ... } — only counts alpha chars.
 */
export function getFrequencies(text) {
  const counts = {};
  for (let i = 0; i < 26; i++) counts[String.fromCharCode(65 + i)] = 0;
  let total = 0;
  for (const ch of text.toUpperCase()) {
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch]++;
      total++;
    }
  }
  if (total === 0) return counts;
  for (const key of Object.keys(counts)) {
    counts[key] = (counts[key] / total) * 100;
  }
  return counts;
}

/**
 * Find the most frequent letter in ciphertext, assume it corresponds to 'E'.
 * Returns best-guess shift: (mostFreqIndex - 4 + 26) % 26.
 */
export function getBestGuessShift(ciphertext) {
  const freqs = getFrequencies(ciphertext);
  let maxLetter = 'E';
  let maxVal = -1;
  for (const [letter, val] of Object.entries(freqs)) {
    if (val > maxVal) { maxVal = val; maxLetter = letter; }
  }
  const idx = maxLetter.charCodeAt(0) - 65; // 0–25
  return ((idx - 4) + 26) % 26;
}
