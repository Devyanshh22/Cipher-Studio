export declare function buildMatrix(keyword: string): string[][];
export declare function cleanPlaintext(text: string): string;
export declare function toDigraphs(text: string): [string, string][];
export declare function encrypt(plaintext: string, keyword: string): string;
export declare function decrypt(ciphertext: string, keyword: string): string;

export interface PlayfairStep {
  a: string; b: string;
  outA: string; outB: string;
  rule: 'row' | 'col' | 'rect';
  posA: { row: number; col: number };
  posB: { row: number; col: number };
}

export declare function getSteps(
  text: string,
  keyword: string,
  mode: 'encrypt' | 'decrypt'
): PlayfairStep[];
