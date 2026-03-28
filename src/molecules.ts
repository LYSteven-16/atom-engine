export interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };
  vertical?: number;
  horizontal?: number;
  verticalGap?: number;
  horizontalGap?: number;
  atoms: any[];
  molecules?: Molecule[];  // 子分子数组（不支持嵌套）
  width?: number;
  height?: number;
  radius?: number;
  visible?: boolean;        // 初始可见性
  disabled?: boolean;       // 初始禁用状态
  selected?: boolean;       // 初始选中状态
  zIndex?: number;          // 初始层级
  className?: string;       // 自定义 CSS 类名
  data?: Record<string, any>;  // 自定义数据
  onMount?: (element: HTMLElement) => void;
  onDestroy?: () => void;
}
