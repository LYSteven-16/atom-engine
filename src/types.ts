export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface BaseAtom {
  position?: Position;
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
}

export interface ResizeAtom extends BaseAtom {
  capability: 'resize';
  direction?: 'horizontal' | 'vertical' | 'both';
}

export interface ScrollAtom extends BaseAtom {
  capability: 'scroll';
}

export interface ClickAtom extends BaseAtom {
  capability: 'click';
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
  collapsedValue?: number;
  expandedValue?: number;
}

export type Atom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom |
  BackgroundAtom | BorderAtom | ShadowAtom |
  ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom |
  DragAtom | ResizeAtom | ScrollAtom | ClickAtom |
  HeightAtom | WidthAtom | CollapseAtom;

export type ContentAtom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom;
export type DecorationAtom = BackgroundAtom | BorderAtom | ShadowAtom;
export type AnimationAtom = ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom | HeightAtom | WidthAtom | CollapseAtom;
export type InputAtom = DragAtom | ResizeAtom | ScrollAtom | ClickAtom;

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
