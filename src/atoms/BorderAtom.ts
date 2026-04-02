import type { AtomContext } from '../atoms';

export interface BorderAtomConfig {
  id: string;
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
  readonly id: string;
  readonly element: HTMLElement;
  borderWidth: number;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;

  constructor(context: AtomContext, container: HTMLElement, config: BorderAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.borderWidth = config.borderWidth;
    this.color = config.color;
    this.position = config.position;
    this.width = config.width;
    this.height = config.height;
    this.radius = config.radius;
    this.element = this.render(container);
  }

  private render(container: HTMLElement): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-atom-id', this.id);
    el.style.cssText = `
      position: absolute;
      left: ${this.position?.x ?? 0}px;
      top: ${this.position?.y ?? 0}px;
      width: ${this.width ?? 100}px;
      height: ${this.height ?? 100}px;
      border: ${this.borderWidth}px solid rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
      border-radius: ${this.radius ?? 0}px;
      background: transparent;
      box-shadow: transparent;
      pointer-events: none;
    `;
    container.appendChild(el);
    return el;
  }

  updateSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }

  updateRadius(radius: number): void {
    this.radius = radius;
    this.element.style.borderRadius = `${radius}px`;
  }
}
