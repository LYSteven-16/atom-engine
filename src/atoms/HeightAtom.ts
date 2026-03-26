import type { AtomContext } from '../atoms';

export interface HeightAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

export class HeightAtom {
  readonly capability: 'height' = 'height';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: HeightAtomConfig;
  private expandedHeight: number;
  private collapsedHeight: number;
  private currentHeight: number;
  private targetHeight: number = 0;
  private startHeight: number = 0;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isExpanded: boolean = true;

  constructor(context: AtomContext, element: HTMLElement, config: HeightAtomConfig) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: false,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.expandedHeight = this.config.value;
    this.collapsedHeight = this.config.collapsedValue ?? this.config.value;
    this.currentHeight = this.expandedHeight;
    this.apply();
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.isExpanded = true;
      this.animateToHeight(this.expandedHeight);
    } else if (!this.config.keepOnRelease) {
      this.isExpanded = false;
      this.animateToHeight(this.collapsedHeight);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      this.animateToHeight(isOddClick ? this.expandedHeight : this.collapsedHeight);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.animateToHeight(this.expandedHeight);
      } else if (!this.config.keepOnRelease) {
        this.isExpanded = false;
        this.animateToHeight(this.collapsedHeight);
      }
    }
  }

  private doubleClickCount: number = 0;

  onDoubleClick(): void {
    if (this.config.trigger !== 'doubleclick') return;
    this.doubleClickCount++;
    const isOddClick = this.doubleClickCount % 2 === 1;
    this.isExpanded = isOddClick;
    this.animateToHeight(isOddClick ? this.expandedHeight : this.collapsedHeight);
  }

  private animateToHeight(targetHeight: number): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startHeight = this.currentHeight;
    this.targetHeight = targetHeight;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentHeight = this.startHeight + (this.targetHeight - this.startHeight) * eased;
      this.apply();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentHeight = this.targetHeight;
        this.apply();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private apply(): void {
    this.element.style.height = `${this.currentHeight}px`;
    this.element.style.overflow = 'hidden';
  }

  reset(): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentHeight = this.expandedHeight;
    this.isExpanded = true;
    this.apply();
  }

  getValue(): number {
    return this.currentHeight;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
