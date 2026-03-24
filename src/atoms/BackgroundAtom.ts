import type { AtomContext } from '../atoms';

export interface BackgroundAtomConfig {
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;
}

export class BackgroundAtom {
  readonly capability: 'background' = 'background';
  readonly context: AtomContext;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;

  constructor(context: AtomContext, container: HTMLElement, config: BackgroundAtomConfig) {
    this.context = context;
    this.color = config.color;
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
      background: rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
      border: transparent;
      box-shadow: none;
      border-radius: ${this.radius ?? 0}px;
      pointer-events: none;
      z-index: ${this.position?.z ?? 0};
    `;
    container.appendChild(el);
  }
}
