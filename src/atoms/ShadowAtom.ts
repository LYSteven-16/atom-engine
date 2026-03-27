import type { AtomContext } from '../atoms';

export interface ShadowAtomConfig {
  id: string;
  x?: number;
  y?: number;
  shadowBlur?: number;
  color: [number, number, number];
  shadowWidth?: number;
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;
}

export class ShadowAtom {
  readonly capability: 'shadow' = 'shadow';
  readonly context: AtomContext;
  readonly id: string;
  readonly element: HTMLElement;
  x: number;
  y: number;
  shadowBlur?: number;
  color: [number, number, number];
  shadowWidth?: number;
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;

  constructor(context: AtomContext, container: HTMLElement, config: ShadowAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.shadowBlur = config.shadowBlur;
    this.color = config.color;
    this.shadowWidth = config.shadowWidth;
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
      box-shadow: ${this.x}px ${this.y}px ${this.shadowBlur ?? 15}px ${this.shadowWidth ?? 1}px rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.5);
      border-radius: ${this.radius ?? 0}px;
      background: transparent;
      border: transparent;
      pointer-events: none;
      z-index: ${this.position?.z ?? -1};
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
