export interface AtomContext {
  bakerId: string;
  bakerIndex: number;
  atomIndex: number;
}

export interface BackgroundAtom {
  capability: 'background';
  context: AtomContext;
  color: [number, number, number];
  width?: number;
  height?: number;
  radius?: number;
}

export interface BorderAtom {
  capability: 'border';
  context: AtomContext;
  width: number;
  color: [number, number, number];
  radius?: number;
  borderWidth?: number;
  borderHeight?: number;
}

export interface ShadowAtom {
  capability: 'shadow';
  context: AtomContext;
  x: number;
  y: number;
  shadowBlur?: number;
  color: [number, number, number];
  shadowWidth?: number;
}

export interface ScaleAtom {
  capability: 'scale';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click';
  duration?: number;
}

export interface OpacityAtom {
  capability: 'opacity';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click';
  duration?: number;
}

export interface RotateAtom {
  capability: 'rotate';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click';
  duration?: number;
}

export interface TranslateAtom {
  capability: 'translate';
  context: AtomContext;
  x: number;
  y: number;
  trigger: 'drag';
  duration?: number;
}

export interface HeightAtom {
  capability: 'height';
  context: AtomContext;
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
  duration?: number;
}

export interface WidthAtom {
  capability: 'width';
  context: AtomContext;
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
  duration?: number;
}

export interface CollapseAtom {
  capability: 'collapse';
  context: AtomContext;
  group: string;
  expandedValue?: number;
  duration?: number;
}
