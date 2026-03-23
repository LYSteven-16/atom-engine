export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface BaseAtom {
  id?: string;
  position?: Position;
  duration?: number;
}

export interface TextAtom extends BaseAtom {
  capability: 'text';
  text: string;
  size: number;
  color: [number, number, number];
}

export interface ImageAtom extends BaseAtom {
  capability: 'image';
  src: string;
  width: number;
  height: number;
  alt?: string;
}

export interface VideoAtom extends BaseAtom {
  capability: 'video';
  src: string;
  width?: number;
  height?: number;
}

export interface AudioAtom extends BaseAtom {
  capability: 'audio';
  src: string;
}

export interface CodeAtom extends BaseAtom {
  capability: 'code';
  code: string;
  language?: string;
}

export interface IconAtom extends BaseAtom {
  capability: 'icon';
  icon: string;
  size?: number;
}

export interface BackgroundAtom extends BaseAtom {
  capability: 'background';
  color: [number, number, number];
  width?: number;
  height?: number;
  radius?: number;
}

export interface BorderAtom extends BaseAtom {
  capability: 'border';
  width: number;
  color: [number, number, number];
  radius?: number;
  borderWidth?: number;
  borderHeight?: number;
}

export interface ShadowAtom extends BaseAtom {
  capability: 'shadow';
  x: number;
  y: number;
  blur: number;
  color: [number, number, number];
  shadowWidth?: number;
  shadowHeight?: number;
  radius?: number;
}

export interface CanvasAtom extends BaseAtom {
  capability: 'canvas';
  position?: Position;
  width: number;
  height: number;
  strokeColor?: [number, number, number];
  strokeWidth?: number;
  backgroundColor?: [number, number, number];
  blackboardStyle?: boolean;
  defaultColors?: [number, number, number][];
  defaultWidths?: number[];
  showToolbar?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export type Trigger = 'hover' | 'click' | 'drag';

export interface ScaleAtom extends BaseAtom {
  capability: 'scale';
  value: number;
  trigger: Trigger;
}

export interface OpacityAtom extends BaseAtom {
  capability: 'opacity';
  value: number;
  trigger: Trigger;
}

export interface RotateAtom extends BaseAtom {
  capability: 'rotate';
  value: number;
  trigger: 'hover' | 'click';
}

export interface TranslateAtom extends BaseAtom {
  capability: 'translate';
  x: number;
  y: number;
  trigger: 'drag';
}

export interface DragAtom extends BaseAtom {
  capability: 'drag';
  spring?: boolean;
  keepOnRelease?: boolean;
}

export interface ResizeAtom extends BaseAtom {
  capability: 'resize';
  direction?: 'horizontal' | 'vertical' | 'both';
}

export interface ResizeHandleAtom extends BaseAtom {
  capability: 'resize-handle';
  edge?: 'nw' | 'ne' | 'sw' | 'se';
  minWidth?: number;
  minHeight?: number;
  handleSize?: number;
  handleColor?: [number, number, number];
  scaleMode?: 'container' | 'proportional';
}

export interface ScrollAtom extends BaseAtom {
  capability: 'scroll';
}

export interface ClickAtom extends BaseAtom {
  capability: 'click';
  keepOnRelease?: boolean;
}

export interface HoverAtom extends BaseAtom {
  capability: 'hover';
  keepOnRelease?: boolean;
}

export interface HeightAtom extends BaseAtom {
  capability: 'height';
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
}

export interface WidthAtom extends BaseAtom {
  capability: 'width';
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
}

export interface CollapseAtom extends BaseAtom {
  capability: 'collapse';
  group: string;
  expandedValue?: number;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: [number, number, number];
  width: number;
  isEraser: boolean;
}

export type Atom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom | CanvasAtom |
  BackgroundAtom | BorderAtom | ShadowAtom |
  ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom |
  DragAtom | ResizeAtom | ResizeHandleAtom | ScrollAtom | ClickAtom |
  HeightAtom | WidthAtom | CollapseAtom;

export type ContentAtom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom | CanvasAtom;
export type DecorationAtom = BackgroundAtom | BorderAtom | ShadowAtom;
export type AnimationAtom = ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom | HeightAtom | WidthAtom | CollapseAtom;
export type InputAtom = DragAtom | ResizeAtom | ScrollAtom | ClickAtom | HoverAtom;

export interface Molecule {
  id: string;
  position?: Position;
  vertical?: number;
  horizontal?: number;
  verticalGap?: number;
  horizontalGap?: number;
  atoms: Atom[];
  width?: number;
  height?: number;
}

export type CSSProperties = Record<string, string | number | undefined>;

export interface EventHandlers {
  onClick?: (event: Event) => void;
  onMouseEnter?: (event: Event) => void;
  onMouseLeave?: (event: Event) => void;
  onMouseDown?: (event: Event) => void;
  onMouseMove?: (event: Event) => void;
  onMouseUp?: (event: Event) => void;
  onScroll?: (event: Event) => void;
  onResize?: (event: Event) => void;
}
