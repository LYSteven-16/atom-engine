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
        this.element.addEventListener('mouseenter', this.callbacks.onHoverStart);
      }
      if (this.callbacks.onHoverEnd) {
        this.element.addEventListener('mouseleave', this.callbacks.onHoverEnd);
      }
      console.log(`[Atom] ${this.context.bakerId} - HoverAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - HoverAtom应用失败:`, error);
    }
  }
}