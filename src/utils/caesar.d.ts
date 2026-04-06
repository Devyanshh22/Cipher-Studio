export declare function encrypt(plaintext: string, shift: number): string;
export declare function decrypt(ciphertext: string, shift: number): string;
export declare function getFrequencies(text: string): Record<string, number>;
export declare function getBestGuessShift(ciphertext: string): number;
export declare const ENGLISH_FREQUENCIES: Record<string, number>;
