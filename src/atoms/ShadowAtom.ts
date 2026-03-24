import type { AtomContext } from '../atoms';

export interface ShadowAtomConfig {
  x?: number;
  y?: number;
  blur?: number;
  color: [number, number, number];
  spread?: number;
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;
}

export class ShadowAtom {
  readonly capability: 'shadow' = 'shadow';
  readonly context: AtomContext;
  x: number;
  y: number;
  blur: number;
  color: [number, number, number];
  spread: number;
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;

  constructor(context: AtomContext, container: HTMLElement, config: ShadowAtomConfig) {
    this.context = context;
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.blur = config.blur ?? 0;
    this.color = config.color;
    this.spread = config.spread ?? 0;
    this.position = config.position;
    this.width = config.width;
    this.height = config.height;
    this.radius = config.radius;
    this.render(container);
  }

  private render(container: HTMLElement): void {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      left: ${this.position?.x ?? 0}px;
      top: ${this.position?.y ?? 0}px;
      width: ${this.width ?? 100}px;
      height: ${this.height ?? 100}px;
      box-shadow: ${this.x}px ${this.y}px ${this.blur}px ${this.spread}px rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.5);
      border-radius: ${this.radius ?? 0}px;
      background: transparent;
      border: transparent;
      pointer-events: none;
      z-index: ${this.position?.z ?? -1};
    `;
    container.appendChild(el);
  }
}
