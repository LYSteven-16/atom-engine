import type { AtomContext } from '../atoms';

export interface WidthAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
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
  private currentWidth: number;
  private targetWidth: number = 0;
  private startWidth: number = 0;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isExpanded: boolean = true;
  private callbacks: WidthAtomCallbacks;

  constructor(context: AtomContext, config: WidthAtomConfig, callbacks: WidthAtomCallbacks) {
    this.context = context;
    this.config = {
      keepOnRelease: true,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.expandedWidth = this.config.value;
    this.collapsedWidth = this.config.collapsedValue ?? 0;
    this.currentWidth = this.expandedWidth;
    this.callbacks = callbacks;
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.animateToWidth(this.expandedWidth);
    } else if (!this.config.keepOnRelease) {
      this.animateToWidth(this.collapsedWidth);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      this.animateToWidth(isOddClick ? this.expandedWidth : this.collapsedWidth);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.animateToWidth(this.expandedWidth);
      } else if (!this.config.keepOnRelease) {
        this.isExpanded = false;
        this.animateToWidth(this.collapsedWidth);
      }
    }
  }

  private doubleClickCount: number = 0;

  onDoubleClick(): void {
    if (this.config.trigger !== 'doubleclick') return;
    this.doubleClickCount++;
    const isOddClick = this.doubleClickCount % 2 === 1;
    this.isExpanded = isOddClick;
    this.animateToWidth(isOddClick ? this.expandedWidth : this.collapsedWidth);
  }

  private animateToWidth(targetWidth: number): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startWidth = this.currentWidth;
    this.targetWidth = targetWidth;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentWidth = this.startWidth + (this.targetWidth - this.startWidth) * eased;
      this.apply();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentWidth = this.targetWidth;
        this.apply();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private apply(): void {
    this.callbacks.onWidthChange?.(Math.round(this.currentWidth));
  }

  reset(): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentWidth = this.expandedWidth;
    this.isExpanded = true;
    this.apply();
  }

  getValue(): number {
    return this.currentWidth;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
