import type { AtomContext } from '../atoms';

export interface WidthAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export interface WidthAtomCallbacks {
  onWidthChange?: (width: number) => void;
}

export class WidthAtom {
  readonly capability: 'width' = 'width';
  readonly context: AtomContext;
  private config: WidthAtomConfig;
  private expandedWidth: number;
  private collapsedWidth: number;
  private isExpanded: boolean = true;
  private callbacks: WidthAtomCallbacks;

  constructor(context: AtomContext, config: WidthAtomConfig, callbacks: WidthAtomCallbacks) {
    this.context = context;
    this.config = {
      keepOnRelease: true,
      toggleOnClick: true,
      ...config
    };
    this.expandedWidth = this.config.value;
    this.collapsedWidth = this.config.collapsedValue ?? 0;
    this.callbacks = callbacks;
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.setWidth(this.expandedWidth);
    } else if (!this.config.keepOnRelease) {
      this.setWidth(this.collapsedWidth);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      this.setWidth(isOddClick ? this.expandedWidth : this.collapsedWidth);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.setWidth(this.expandedWidth);
      } else if (!this.config.keepOnRelease) {
        this.isExpanded = false;
        this.setWidth(this.collapsedWidth);
      }
    }
  }

  private doubleClickCount: number = 0;

  onDoubleClick(): void {
    if (this.config.trigger !== 'doubleclick') return;
    this.doubleClickCount++;
    const isOddClick = this.doubleClickCount % 2 === 1;
    this.isExpanded = isOddClick;
    this.setWidth(isOddClick ? this.expandedWidth : this.collapsedWidth);
  }

  private setWidth(width: number): void {
    this.callbacks.onWidthChange?.(width);
  }

  getValue(): number {
    return this.isExpanded ? this.expandedWidth : this.collapsedWidth;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
