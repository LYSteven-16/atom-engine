export interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };
  vertical?: number;
  horizontal?: number;
  verticalGap?: number;
  horizontalGap?: number;
  atoms: any[];
  molecules?: Molecule[];  // 子分子数组
  width?: number;
  height?: number;
  radius?: number;
}
