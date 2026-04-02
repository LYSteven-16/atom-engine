import type { AtomContext } from '../atoms';

export interface BackgroundGradient {
  type: 'linear' | 'radial';
  colors: [number, number, number][];
  direction?: string;
}

export interface BackgroundAtomConfig {
  id: string;
  color?: [number, number, number];
  opacity?: number;
  gradient?: BackgroundGradient;
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;
}

export class BackgroundAtom {
  readonly capability: 'background' = 'background';
  readonly context: AtomContext;
  readonly id: string;
  readonly element: HTMLElement;
  color?: [number, number, number];
  opacity?: number;
  gradient?: BackgroundGradient;
  position?: { x: number; y: number; z?: number };
  width?: number;
  height?: number;
  radius?: number;

  constructor(context: AtomContext, container: HTMLElement, config: BackgroundAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.color = config.color;
    this.opacity = config.opacity;
    this.gradient = config.gradient;
    this.position = config.position;
    this.width = config.width;
    this.height = config.height;
    this.radius = config.radius;
    this.element = this.render(container);
  }

  private render(container: HTMLElement): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-atom-id', this.id);
    
    let background = '';
    if (this.gradient) {
      const colors = this.gradient.colors.map(c => `rgb(${c[0]}, ${c[1]}, ${c[2]})`).join(', ');
      if (this.gradient.type === 'linear') {
        background = `linear-gradient(${this.gradient.direction ?? 'to right'}, ${colors})`;
      } else {
        background = `radial-gradient(${colors})`;
      }
    } else if (this.color) {
      background = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
    } else {
      background = 'transparent';
    }

    el.style.cssText = `
      position: absolute;
      left: ${this.position?.x ?? 0}px;
      top: ${this.position?.y ?? 0}px;
      width: ${this.width ?? 100}px;
      height: ${this.height ?? 100}px;
      background: ${background};
      opacity: ${this.opacity ?? 1};
      border: transparent;
      box-shadow: transparent;
      border-radius: ${this.radius ?? 0}px;
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

  updateOpacity(opacity: number): void {
    this.opacity = opacity;
    this.element.style.opacity = `${opacity}`;
  }
}
