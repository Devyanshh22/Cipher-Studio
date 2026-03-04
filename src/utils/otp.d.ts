export declare function encrypt(plaintext: string, key: string): string;
export declare function decrypt(hexCiphertext: string, key: string): string;
export declare function generateKey(length: number): string;

export interface OtpStep {
  char: string;
  charCode: number;
  keyChar: string;
  keyCode: number;
  xored: number;
  hexByte: string;
}

export declare function getSteps(plaintext: string, key: string): OtpStep[];
