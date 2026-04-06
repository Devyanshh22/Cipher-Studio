// ─── Vigenère Cipher ─────────────────────────────────────────────────────────

/** Encrypt plaintext with keyword. Returns uppercase alpha-only ciphertext. */
export function encrypt(plaintext, keyword) {
  if (!plaintext || !keyword) return '';
  const plain = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
  const key   = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!plain.length || !key.length) return plain;
  return plain.split('').map((ch, i) => {
    const p = ch.charCodeAt(0) - 65;
    const k = key.charCodeAt(i % key.length) - 65;
    return String.fromCharCode(((p + k) % 26) + 65);
  }).join('');
}

/** Decrypt ciphertext with keyword. Returns uppercase plaintext. */
export function decrypt(ciphertext, keyword) {
  if (!ciphertext || !keyword) return '';
  const cipher = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  const key    = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cipher.length || !key.length) return cipher;
  return cipher.split('').map((ch, i) => {
    const c = ch.charCodeAt(0) - 65;
    const k = key.charCodeAt(i % key.length) - 65;
    return String.fromCharCode(((c - k + 26) % 26) + 65);
  }).join('');
}

/**
 * Build a per-character shift table for visualization.
 * Each entry: { pos, plain, keyChar, shift, cipher }
 */
export function getShiftTable(text, keyword, mode) {
  if (!text || !keyword) return [];
  const input = text.toUpperCase().replace(/[^A-Z]/g, '');
  const key   = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!input.length || !key.length) return [];

  return input.split('').map((ch, i) => {
    const p      = ch.charCodeAt(0) - 65;
    const keyIdx = i % key.length;
    const k      = key.charCodeAt(keyIdx) - 65;
    const result = mode === 'encrypt'
      ? ((p + k) % 26)
      : ((p - k + 26) % 26);
    return {
      pos:     i,
      plain:   ch,
      keyChar: key[keyIdx],
      shift:   k,
      cipher:  String.fromCharCode(result + 65),
    };
  });
}
