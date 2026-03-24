import type { AtomContext } from '../atoms';

export interface BorderAtomConfig {
  borderWidth: number;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;
}

export class BorderAtom {
  readonly capability: 'border' = 'border';
  readonly context: AtomContext;
  borderWidth: number;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;

  constructor(context: AtomContext, container: HTMLElement, config: BorderAtomConfig) {
    this.context = context;
    this.borderWidth = config.borderWidth;
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
      box-sizing: border-box;
      border: ${this.borderWidth}px solid rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
      border-radius: ${this.radius ?? 0}px;
      pointer-events: none;
      z-index: ${this.position?.z ?? 0};
    `;
    container.appendChild(el);
  }
}
