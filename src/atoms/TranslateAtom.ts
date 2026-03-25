import type { AtomContext } from '../atoms';

export interface TranslateAtomConfig {
  trigger: 'drag';
  keepOnRelease?: boolean;
}

export class TranslateAtom {
  readonly capability: 'translate' = 'translate';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: TranslateAtomConfig;
  private originX: number = 0;
  private originY: number = 0;
  private elementStartX: number = 0;
  private elementStartY: number = 0;
  private mouseStartX: number = 0;
  private mouseStartY: number = 0;
  private isDragging: boolean = false;

  constructor(context: AtomContext, element: HTMLElement, config: TranslateAtomConfig, originPosition: { x: number; y: number }) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: false,
      ...config
    };
    this.originX = originPosition.x;
    this.originY = originPosition.y;
  }

  onDragStart(mouse: { clientX: number; clientY: number }): void {
    this.isDragging = true;
    this.mouseStartX = mouse.clientX;
    this.mouseStartY = mouse.clientY;
    this.elementStartX = parseFloat(this.element.style.left) || 0;
    this.elementStartY = parseFloat(this.element.style.top) || 0;
  }

  onDragMove(mouse: { clientX: number; clientY: number }): void {
    if (!this.isDragging) return;
    const dx = mouse.clientX - this.mouseStartX;
    const dy = mouse.clientY - this.mouseStartY;
    const newX = this.elementStartX + dx;
    const newY = this.elementStartY + dy;
    this.element.style.left = `${newX}px`;
    this.element.style.top = `${newY}px`;
  }

  onDragEnd(): void {
    this.isDragging = false;
    if (!this.config.keepOnRelease) {
      this.element.style.left = `${this.originX}px`;
      this.element.style.top = `${this.originY}px`;
    }
  }

  updateOrigin(originPosition: { x: number; y: number }): void {
    this.originX = originPosition.x;
    this.originY = originPosition.y;
  }

  getValue(): { x: number; y: number } {
    return {
      x: parseFloat(this.element.style.left) || 0,
      y: parseFloat(this.element.style.top) || 0
    };
  }
}
