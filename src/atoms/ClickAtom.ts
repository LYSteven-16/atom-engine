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
  private onClickHandler: ((e: Event) => void) | null = null;
  private onDoubleClickHandler: ((e: Event) => void) | null = null;
  private onMouseDownHandler: ((e: Event) => void) | null = null;
  private onMouseUpHandler: ((e: Event) => void) | null = null;

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
        this.onClickHandler = (e: Event) => {
          this.clickCount++;
          this.callbacks.onClick?.(e as MouseEvent, this.clickCount);
        };
        this.element.addEventListener('click', this.onClickHandler);
      }
      if (this.callbacks.onDoubleClick) {
        this.onDoubleClickHandler = (e: Event) => {
          this.callbacks.onDoubleClick?.(e as MouseEvent);
        };
        this.element.addEventListener('dblclick', this.onDoubleClickHandler);
      }
      if (this.callbacks.onMouseDown) {
        this.onMouseDownHandler = (e: Event) => {
          this.callbacks.onMouseDown?.(e as MouseEvent);
        };
        this.element.addEventListener('mousedown', this.onMouseDownHandler);
      }
      if (this.callbacks.onMouseUp) {
        this.onMouseUpHandler = (e: Event) => {
          this.callbacks.onMouseUp?.(e as MouseEvent);
        };
        this.element.addEventListener('mouseup', this.onMouseUpHandler);
      }
      console.log(`[Atom] ${this.context.bakerId} - ClickAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ClickAtom应用失败:`, error);
    }
  }

  destroy(): void {
    if (this.onClickHandler) {
      this.element.removeEventListener('click', this.onClickHandler);
    }
    if (this.onDoubleClickHandler) {
      this.element.removeEventListener('dblclick', this.onDoubleClickHandler);
    }
    if (this.onMouseDownHandler) {
      this.element.removeEventListener('mousedown', this.onMouseDownHandler);
    }
    if (this.onMouseUpHandler) {
      this.element.removeEventListener('mouseup', this.onMouseUpHandler);
    }
    this.onClickHandler = null;
    this.onDoubleClickHandler = null;
    this.onMouseDownHandler = null;
    this.onMouseUpHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - ClickAtom已销毁`);
  }
}
