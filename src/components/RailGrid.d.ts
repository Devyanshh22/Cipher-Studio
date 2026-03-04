import { FC } from 'react';

interface RailGridProps {
  inputText: string;
  numRails: number;
  mode: 'encrypt' | 'decrypt';
  visibleCount?: number | null;
}

declare const RailGrid: FC<RailGridProps>;
export default RailGrid;

export declare const RAIL_COLORS: string[];
