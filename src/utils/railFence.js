/**
 * Rail Fence Cipher Utility
 * Implements encrypt, decrypt, and getRailPattern functions.
 */

/**
 * Returns an array where each element is the rail index for that character position.
 * @param {number} textLength - Number of characters
 * @param {number} numRails - Number of rails (2–8)
 * @returns {number[]} Array of rail indices
 */
export function getRailPattern(textLength, numRails) {
  if (numRails < 2) return Array(textLength).fill(0);
  const pattern = [];
  let rail = 0;
  let direction = 1;
  for (let i = 0; i < textLength; i++) {
    pattern.push(rail);
    if (rail === 0) direction = 1;
    else if (rail === numRails - 1) direction = -1;
    rail += direction;
  }
  return pattern;
}

/**
 * Encrypts plaintext using the Rail Fence cipher.
 * @param {string} plaintext
 * @param {number} numRails
 * @returns {string} ciphertext
 */
export function encrypt(plaintext, numRails) {
  if (!plaintext) return '';
  if (numRails < 2) return plaintext;

  const rails = Array.from({ length: numRails }, () => '');
  const pattern = getRailPattern(plaintext.length, numRails);

  for (let i = 0; i < plaintext.length; i++) {
    rails[pattern[i]] += plaintext[i];
  }

  return rails.join('');
}

/**
 * Decrypts ciphertext using the Rail Fence cipher.
 * @param {string} ciphertext
 * @param {number} numRails
 * @returns {string} plaintext
 */
export function decrypt(ciphertext, numRails) {
  if (!ciphertext) return '';
  if (numRails < 2) return ciphertext;

  const len = ciphertext.length;
  const pattern = getRailPattern(len, numRails);

  // Count characters per rail
  const railLengths = Array(numRails).fill(0);
  for (let i = 0; i < len; i++) {
    railLengths[pattern[i]]++;
  }

  // Slice ciphertext into per-rail segments
  const railSegments = [];
  let offset = 0;
  for (let r = 0; r < numRails; r++) {
    railSegments.push(ciphertext.slice(offset, offset + railLengths[r]));
    offset += railLengths[r];
  }

  // Read characters back in zigzag order
  const railPointers = Array(numRails).fill(0);
  let result = '';
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    result += railSegments[r][railPointers[r]];
    railPointers[r]++;
  }

  return result;
}

// ─── Self-test (runs in Node or browser console) ───────────────────────────
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const classic = encrypt('WEAREDISCOVEREDFLEEAATONCE', 3);
  console.log('[railFence] encrypt WEAREDISCOVEREDFLEEAATONCE,3 →', classic);

  const roundTrip = decrypt(encrypt('HELLO WORLD', 3), 3);
  const passed = roundTrip === 'HELLO WORLD';
  console.log(`[railFence] round-trip HELLO WORLD,3 → "${roundTrip}" — ${passed ? 'PASS ✓' : 'FAIL ✗'}`);
}
