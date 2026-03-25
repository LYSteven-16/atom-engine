import type { AtomContext } from '../atoms';

export interface WidthAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export type WidthChangeCallback = (width: number) => void;

export class WidthAtom {
  readonly capability: 'width' = 'width';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: WidthAtomConfig;
  private expandedWidth: number;
  private collapsedWidth: number;
  private isExpanded: boolean = true;
  private onWidthChange: WidthChangeCallback | null;

  constructor(context: AtomContext, element: HTMLElement, config: WidthAtomConfig, onWidthChange?: WidthChangeCallback) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: true,
      toggleOnClick: true,
      ...config
    };
    this.expandedWidth = this.config.value;
    this.collapsedWidth = this.config.collapsedValue ?? 0;
    this.onWidthChange = onWidthChange ?? null;
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
    this.element.style.width = `${width}px`;
    this.element.style.overflow = 'hidden';
    this.onWidthChange?.(width);
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.setWidth(this.isExpanded ? this.expandedWidth : this.collapsedWidth);
  }

  reset(): void {
    this.isExpanded = true;
    this.element.style.width = 'auto';
    this.element.style.overflow = '';
    this.onWidthChange?.(this.expandedWidth);
  }

  getValue(): number {
    return this.isExpanded ? this.expandedWidth : this.collapsedWidth;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
