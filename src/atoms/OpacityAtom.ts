import type { AtomContext } from '../atoms';

export interface OpacityAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  defaultValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

export class OpacityAtom {
  readonly capability: 'opacity' = 'opacity';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: OpacityAtomConfig;
  private currentOpacity: number = 1;
  private targetOpacity: number = 1;
  private startOpacity: number = 1;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isActive: boolean = false;

  constructor(context: AtomContext, element: HTMLElement, config: OpacityAtomConfig) {
    this.context = context;
    this.element = element;
    this.config = {
      defaultValue: 1,
      keepOnRelease: false,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.apply();
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.isActive = true;
      this.animateToOpacity(this.config.value);
    } else if (!this.config.keepOnRelease) {
      this.isActive = false;
      this.animateToOpacity(this.config.defaultValue ?? 1);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToOpacity(this.config.value);
      } else {
        this.isActive = false;
        this.animateToOpacity(this.config.defaultValue ?? 1);
      }
    } else {
      if (isClicked) {
        this.isActive = true;
        this.animateToOpacity(this.config.value);
      } else if (!this.config.keepOnRelease) {
        this.isActive = false;
        this.animateToOpacity(this.config.defaultValue ?? 1);
      }
    }
  }

  private doubleClickCount: number = 0;

  onDoubleClick(): void {
    if (this.config.trigger !== 'doubleclick') return;
    this.doubleClickCount++;
    if (this.config.toggleOnClick) {
      const isOddClick = this.doubleClickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToOpacity(this.config.value);
      } else {
        this.isActive = false;
        this.animateToOpacity(this.config.defaultValue ?? 1);
      }
    } else {
      this.isActive = true;
      this.animateToOpacity(this.config.value);
    }
  }

  private animateToOpacity(targetOpacity: number): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startOpacity = this.currentOpacity;
    this.targetOpacity = targetOpacity;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentOpacity = this.startOpacity + (this.targetOpacity - this.startOpacity) * eased;
      this.apply();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentOpacity = this.targetOpacity;
        this.apply();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  reset(): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentOpacity = this.config.defaultValue ?? 1;
    this.isActive = false;
    this.apply();
  }

  private apply(): void {
    this.element.style.opacity = this.currentOpacity.toString();
  }

  getValue(): number {
    return this.currentOpacity;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
