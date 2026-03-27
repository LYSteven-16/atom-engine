import type { AtomContext } from '../atoms';

export interface ClickInputCallbacks {
  id: string;
  onClick?: (e: MouseEvent, clickCount: number) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
}

export class ClickAtom {
  readonly capability: 'click' = 'click';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private callbacks: ClickInputCallbacks;
  private clickCount: number = 0;

  constructor(context: AtomContext, element: HTMLElement, callbacks: ClickInputCallbacks) {
    this.context = context;
    this.id = callbacks.id;
    this.element = element;
    this.callbacks = callbacks;
    this.apply();
  }

  private apply(): void {
    try {
      if (this.callbacks.onClick) {
        this.element.addEventListener('click', (e) => {
          this.clickCount++;
          this.callbacks.onClick?.(e, this.clickCount);
        });
      }
      if (this.callbacks.onDoubleClick) {
        this.element.addEventListener('dblclick', this.callbacks.onDoubleClick);
      }
      if (this.callbacks.onMouseDown) {
        this.element.addEventListener('mousedown', this.callbacks.onMouseDown);
      }
      if (this.callbacks.onMouseUp) {
        this.element.addEventListener('mouseup', this.callbacks.onMouseUp);
      }
      console.log(`[Atom] ${this.context.bakerId} - ClickAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ClickAtom应用失败:`, error);
    }
  }
}
