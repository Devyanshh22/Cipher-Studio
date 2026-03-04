// ─── Playfair Cipher ─────────────────────────────────────────────────────────

/** Build a 5×5 key matrix from keyword. J is merged with I. */
export function buildMatrix(keyword) {
  const seen = new Set();
  const chars = [];
  const normalized = (keyword.toUpperCase() + 'ABCDEFGHIKLMNOPQRSTUVWXYZ')
    .replace(/J/g, 'I');
  for (const ch of normalized) {
    if (/[A-Z]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      chars.push(ch);
    }
  }
  // Return as 5×5 2D array
  return Array.from({ length: 5 }, (_, r) => chars.slice(r * 5, r * 5 + 5));
}

/** Build lookup: char → { row, col } */
function buildIndex(matrix) {
  const idx = {};
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++)
      idx[matrix[r][c]] = { row: r, col: c };
  return idx;
}

/** Clean plaintext for encryption */
export function cleanPlaintext(text) {
  let s = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  // Insert X between repeated letters in a pair
  let result = '';
  let i = 0;
  while (i < s.length) {
    result += s[i];
    if (i + 1 < s.length && s[i] === s[i + 1]) {
      result += 'X';
    }
    i++;
  }
  // Pad to even length
  if (result.length % 2 !== 0) result += 'X';
  return result;
}

/** Split string into digraphs */
export function toDigraphs(text) {
  const pairs = [];
  for (let i = 0; i < text.length; i += 2)
    pairs.push([text[i], text[i + 1]]);
  return pairs;
}

/**
 * Encrypt a digraph using Playfair rules.
 * Returns { a, b, rule } where rule is 'row' | 'col' | 'rect'
 */
function encryptDigraph(a, b, matrix, idx) {
  const pa = idx[a], pb = idx[b];
  if (pa.row === pb.row) {
    return {
      a: matrix[pa.row][(pa.col + 1) % 5],
      b: matrix[pb.row][(pb.col + 1) % 5],
      rule: 'row',
    };
  } else if (pa.col === pb.col) {
    return {
      a: matrix[(pa.row + 1) % 5][pa.col],
      b: matrix[(pb.row + 1) % 5][pb.col],
      rule: 'col',
    };
  } else {
    return {
      a: matrix[pa.row][pb.col],
      b: matrix[pb.row][pa.col],
      rule: 'rect',
    };
  }
}

/**
 * Decrypt a digraph using reverse Playfair rules.
 */
function decryptDigraph(a, b, matrix, idx) {
  const pa = idx[a], pb = idx[b];
  if (pa.row === pb.row) {
    return {
      a: matrix[pa.row][(pa.col + 4) % 5],
      b: matrix[pb.row][(pb.col + 4) % 5],
      rule: 'row',
    };
  } else if (pa.col === pb.col) {
    return {
      a: matrix[(pa.row + 4) % 5][pa.col],
      b: matrix[(pb.row + 4) % 5][pb.col],
      rule: 'col',
    };
  } else {
    return {
      a: matrix[pa.row][pb.col],
      b: matrix[pb.row][pa.col],
      rule: 'rect',
    };
  }
}

/** Encrypt plaintext with keyword. Returns ciphertext string. */
export function encrypt(plaintext, keyword) {
  if (!plaintext || !keyword) return '';
  const matrix = buildMatrix(keyword);
  const idx    = buildIndex(matrix);
  const clean  = cleanPlaintext(plaintext);
  const pairs  = toDigraphs(clean);
  return pairs.map(([a, b]) => {
    const r = encryptDigraph(a, b, matrix, idx);
    return r.a + r.b;
  }).join('');
}

/** Decrypt ciphertext with keyword. Returns plaintext string. */
export function decrypt(ciphertext, keyword) {
  if (!ciphertext || !keyword) return '';
  const matrix = buildMatrix(keyword);
  const idx    = buildIndex(matrix);
  const clean  = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length % 2 !== 0) return '';
  const pairs  = toDigraphs(clean);
  return pairs.map(([a, b]) => {
    const r = decryptDigraph(a, b, matrix, idx);
    return r.a + r.b;
  }).join('');
}

/**
 * Returns step-by-step data for visualization.
 * Each step: { a, b, encA, encB, rule, posA, posB }
 */
export function getSteps(text, keyword, mode) {
  if (!text || !keyword) return [];
  const matrix = buildMatrix(keyword);
  const idx    = buildIndex(matrix);

  let pairs;
  if (mode === 'encrypt') {
    const clean = cleanPlaintext(text);
    pairs = toDigraphs(clean);
  } else {
    const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length % 2 !== 0) return [];
    pairs = toDigraphs(clean);
  }

  return pairs.map(([a, b]) => {
    const fn = mode === 'encrypt' ? encryptDigraph : decryptDigraph;
    const r  = fn(a, b, matrix, idx);
    return {
      a, b,
      outA: r.a, outB: r.b,
      rule: r.rule,
      posA: idx[a],
      posB: idx[b],
    };
  });
}
