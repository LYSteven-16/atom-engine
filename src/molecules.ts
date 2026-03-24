export interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };
  vertical?: number;
  horizontal?: number;
  verticalGap?: number;
  horizontalGap?: number;
  atoms: any[];
  width?: number;
  height?: number;
  radius?: number;
}
