// ─── One-Time Pad Cipher ──────────────────────────────────────────────────────

/** Encrypt plaintext with key. Returns uppercase hex string. */
export function encrypt(plaintext, key) {
  if (!plaintext || !key) return '';
  let hex = '';
  for (let i = 0; i < plaintext.length; i++) {
    const xored = plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    hex += xored.toString(16).padStart(2, '0').toUpperCase();
  }
  return hex;
}

/** Decrypt hex ciphertext with key. Returns original plaintext string. */
export function decrypt(hexCiphertext, key) {
  if (!hexCiphertext || !key) return '';
  const clean = hexCiphertext.replace(/\s/g, '');
  if (clean.length % 2 !== 0) return '';
  let result = '';
  for (let i = 0; i < clean.length; i += 2) {
    const byte  = parseInt(clean.slice(i, i + 2), 16);
    if (isNaN(byte)) return '';
    const keyChar = key.charCodeAt((i / 2) % key.length);
    result += String.fromCharCode(byte ^ keyChar);
  }
  return result;
}

/** Generate a random key of given length using printable ASCII (33–126). */
export function generateKey(length) {
  let key = '';
  for (let i = 0; i < length; i++) {
    key += String.fromCharCode(33 + Math.floor(Math.random() * 94));
  }
  return key;
}

/**
 * Returns per-character step data for visualization.
 * Each step: { char, charCode, keyChar, keyCode, xored, hexByte }
 */
export function getSteps(plaintext, key) {
  if (!plaintext || !key) return [];
  return Array.from(plaintext).map((ch, i) => {
    const charCode = ch.charCodeAt(0);
    const keyChar  = key[i % key.length];
    const keyCode  = keyChar.charCodeAt(0);
    const xored    = charCode ^ keyCode;
    return {
      char:    ch,
      charCode,
      keyChar,
      keyCode,
      xored,
      hexByte: xored.toString(16).padStart(2, '0').toUpperCase(),
    };
  });
}
