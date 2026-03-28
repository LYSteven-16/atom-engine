import type { AtomContext } from '../atoms';

export interface FlexAtomConfig {
  id: string;
  direction?: 'row' | 'column';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  wrap?: boolean;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
}

export class FlexAtom {
  readonly capability: 'flex' = 'flex';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement | null = null;
  private config: FlexAtomConfig;

  constructor(context: AtomContext, container: HTMLElement, config: FlexAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = {
      direction: 'row',
      gap: 0,
      align: 'start',
      justify: 'start',
      wrap: false,
      ...config
    };
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const flexContainer = document.createElement('div');
      flexContainer.setAttribute('data-atom-id', this.id);

      const width = this.config.width ?? 300;
      const height = this.config.height ?? 200;

      const alignMap: Record<string, string> = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        stretch: 'stretch'
      };

      const justifyMap: Record<string, string> = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        'space-between': 'space-between',
        'space-around': 'space-around'
      };

      flexContainer.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: ${this.config.direction};
        gap: ${this.config.gap ?? 0}px;
        align-items: ${alignMap[this.config.align ?? 'start']};
        justify-content: ${justifyMap[this.config.justify ?? 'start']};
        flex-wrap: ${this.config.wrap ? 'wrap' : 'nowrap'};
        box-sizing: border-box;
      `;

      container.appendChild(flexContainer);
      this.element = flexContainer;
      console.log(`[Atom] ${this.context.bakerId} - FlexAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - FlexAtom渲染失败:`, error);
    }
  }

  public getElement(): HTMLElement | null {
    return this.element;
  }

  public addChild(child: HTMLElement): void {
    this.element?.appendChild(child);
  }

  public removeChild(child: HTMLElement): void {
    if (child.parentNode === this.element) {
      this.element?.removeChild(child);
    }
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - FlexAtom已销毁`);
  }
}
