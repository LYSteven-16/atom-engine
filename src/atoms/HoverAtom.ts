import type { AtomContext } from '../atoms';

export interface HoverInputCallbacks {
  id: string;
  onHoverStart?: (e: MouseEvent) => void;
  onHoverEnd?: (e: MouseEvent) => void;
}

export class HoverAtom {
  readonly capability: 'hover' = 'hover';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private callbacks: HoverInputCallbacks;
  private onHoverStartHandler: ((e: Event) => void) | null = null;
  private onHoverEndHandler: ((e: Event) => void) | null = null;

  constructor(context: AtomContext, element: HTMLElement, callbacks: HoverInputCallbacks) {
    this.context = context;
    this.id = callbacks.id;
    this.element = element;
    this.callbacks = callbacks;
    this.apply();
  }

  private apply(): void {
    try {
      if (this.callbacks.onHoverStart) {
        this.onHoverStartHandler = (e: Event) => {
          this.callbacks.onHoverStart?.(e as MouseEvent);
        };
        this.element.addEventListener('mouseenter', this.onHoverStartHandler);
      }
      if (this.callbacks.onHoverEnd) {
        this.onHoverEndHandler = (e: Event) => {
          this.callbacks.onHoverEnd?.(e as MouseEvent);
        };
        this.element.addEventListener('mouseleave', this.onHoverEndHandler);
      }
      console.log(`[Atom] ${this.context.bakerId} - HoverAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - HoverAtom应用失败:`, error);
    }
  }

  destroy(): void {
    if (this.onHoverStartHandler) {
      this.element.removeEventListener('mouseenter', this.onHoverStartHandler);
    }
    if (this.onHoverEndHandler) {
      this.element.removeEventListener('mouseleave', this.onHoverEndHandler);
    }
    this.onHoverStartHandler = null;
    this.onHoverEndHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - HoverAtom已销毁`);
  }
}
