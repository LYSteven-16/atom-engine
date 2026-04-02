import type { AtomContext } from '../atoms';

export interface ScrollContainerAtomConfig {
  id: string;
  direction?: 'vertical' | 'horizontal' | 'both';
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  onScroll?: (pos: { scrollX: number; scrollY: number }) => void;
}

export class ScrollContainerAtom {
  readonly capability: 'scroll-container' = 'scroll-container';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement | null = null;
  private config: ScrollContainerAtomConfig;

  constructor(context: AtomContext, container: HTMLElement, config: ScrollContainerAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = {
      direction: 'vertical',
      ...config
    };
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const scrollContainer = document.createElement('div');
      scrollContainer.setAttribute('data-atom-id', this.id);

      const width = this.config.width ?? 300;
      const height = this.config.height ?? 200;

      let overflow = 'hidden';
      if (this.config.direction === 'vertical') {
        overflow = 'auto hidden';
      } else if (this.config.direction === 'horizontal') {
        overflow = 'hidden auto';
      } else {
        overflow = 'auto';
      }

      scrollContainer.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        overflow: ${overflow};
        box-sizing: border-box;
      `;

      scrollContainer.addEventListener('scroll', (e) => {
        const target = e.target as HTMLElement;
        this.config.onScroll?.({
          scrollX: target.scrollLeft,
          scrollY: target.scrollTop
        });
      });

      container.appendChild(scrollContainer);
      this.element = scrollContainer;
      console.log(`[Atom] ${this.context.bakerId} - ScrollContainerAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ScrollContainerAtom渲染失败:`, error);
    }
  }

  public getElement(): HTMLElement | null {
    return this.element;
  }

  public getScrollPosition(): { scrollX: number; scrollY: number } {
    return {
      scrollX: this.element?.scrollLeft ?? 0,
      scrollY: this.element?.scrollTop ?? 0
    };
  }

  public scrollTo(x: number, y: number): void {
    this.element?.scrollTo(x, y);
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - ScrollContainerAtom已销毁`);
  }
}
