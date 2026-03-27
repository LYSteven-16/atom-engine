import type { AtomContext } from '../atoms';

export interface ScrollInputCallbacks {
  onScroll?: (pos: { scrollX: number; scrollY: number }) => void;
}

export interface ScrollAtomConfig {
  id: string;
  direction?: 'horizontal' | 'vertical' | 'both';
  maxScrollX?: number;
  maxScrollY?: number;
}

export class ScrollAtom {
  readonly capability: 'scroll' = 'scroll';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: ScrollAtomConfig;
  private callbacks: ScrollInputCallbacks;
  private scrollX: number = 0;
  private scrollY: number = 0;

  constructor(context: AtomContext, element: HTMLElement, config: ScrollAtomConfig, callbacks: ScrollInputCallbacks) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.callbacks = callbacks;
    this.apply();
  }

  private apply(): void {
    try {
      this.element.style.overflow = 'hidden';

      const maxScrollX = this.config.maxScrollX ?? Infinity;
      const maxScrollY = this.config.maxScrollY ?? Infinity;

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();

        if (this.config.direction === 'horizontal' || this.config.direction === 'both') {
          this.scrollX = Math.max(0, Math.min(maxScrollX, this.scrollX + e.deltaX + e.deltaY));
        }

        if (this.config.direction === 'vertical' || this.config.direction === 'both' || !this.config.direction) {
          this.scrollY = Math.max(0, Math.min(maxScrollY, this.scrollY + e.deltaY));
        }

        this.callbacks.onScroll?.({ scrollX: this.scrollX, scrollY: this.scrollY });
      };

      this.element.addEventListener('wheel', onWheel, { passive: false });
      console.log(`[Atom] ${this.context.bakerId} - ScrollAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ScrollAtom应用失败:`, error);
    }
  }
}