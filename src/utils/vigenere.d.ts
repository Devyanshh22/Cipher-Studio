export declare function encrypt(plaintext: string, keyword: string): string;
export declare function decrypt(ciphertext: string, keyword: string): string;

export interface VigenereStep {
  pos: number;
  plain: string;
  keyChar: string;
  shift: number;
  cipher: string;
}

export declare function getShiftTable(
  text: string,
  keyword: string,
  mode: 'encrypt' | 'decrypt'
): VigenereStep[];
