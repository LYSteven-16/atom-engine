import type { AtomContext } from '../atoms';

export interface HeightAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export type HeightChangeCallback = (height: number) => void;

export class HeightAtom {
  readonly capability: 'height' = 'height';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: HeightAtomConfig;
  private expandedHeight: number;
  private collapsedHeight: number;
  private isExpanded: boolean = true;
  private onHeightChange: HeightChangeCallback | null;

  constructor(context: AtomContext, element: HTMLElement, config: HeightAtomConfig, onHeightChange?: HeightChangeCallback) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: true,
      toggleOnClick: true,
      ...config
    };
    this.expandedHeight = this.config.value;
    this.collapsedHeight = this.config.collapsedValue ?? 0;
    this.onHeightChange = onHeightChange ?? null;
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.setHeight(this.expandedHeight);
    } else if (!this.config.keepOnRelease) {
      this.setHeight(this.collapsedHeight);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      this.setHeight(isOddClick ? this.expandedHeight : this.collapsedHeight);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.setHeight(this.expandedHeight);
      } else if (!this.config.keepOnRelease) {
        this.isExpanded = false;
        this.setHeight(this.collapsedHeight);
      }
    }
  }

  private doubleClickCount: number = 0;

  onDoubleClick(): void {
    if (this.config.trigger !== 'doubleclick') return;
    this.doubleClickCount++;
    const isOddClick = this.doubleClickCount % 2 === 1;
    this.isExpanded = isOddClick;
    this.setHeight(isOddClick ? this.expandedHeight : this.collapsedHeight);
  }

  private setHeight(height: number): void {
    this.element.style.height = `${height}px`;
    this.element.style.overflow = 'hidden';
    this.onHeightChange?.(height);
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.setHeight(this.isExpanded ? this.expandedHeight : this.collapsedHeight);
  }

  reset(): void {
    this.isExpanded = true;
    this.element.style.height = 'auto';
    this.element.style.overflow = '';
    this.onHeightChange?.(this.expandedHeight);
  }

  getValue(): number {
    return this.isExpanded ? this.expandedHeight : this.collapsedHeight;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
