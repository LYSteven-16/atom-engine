import type { AtomContext } from '../atoms';

export interface RotateAtomConfig {
  value: number;
  trigger: 'hover' | 'click';
  defaultValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

export class RotateAtom {
  readonly capability: 'rotate' = 'rotate';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: RotateAtomConfig;
  private currentRotate: number = 0;
  private targetRotate: number = 0;
  private startRotate: number = 0;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isActive: boolean = false;

  constructor(context: AtomContext, element: HTMLElement, config: RotateAtomConfig) {
    this.context = context;
    this.element = element;
    this.config = {
      defaultValue: 0,
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
      this.animateToRotate(this.config.value);
    } else if (!this.config.keepOnRelease) {
      this.isActive = false;
      this.animateToRotate(this.config.defaultValue ?? 0);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;
    if (!isClicked) return;

    if (this.config.toggleOnClick) {
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToRotate(this.config.value);
      } else {
        this.isActive = false;
        this.animateToRotate(this.config.defaultValue ?? 0);
      }
    } else {
      this.isActive = true;
      this.animateToRotate(this.config.value);
    }
  }

  private animateToRotate(targetRotate: number): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startRotate = this.currentRotate;
    this.targetRotate = targetRotate;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentRotate = this.startRotate + (this.targetRotate - this.startRotate) * eased;
      this.apply();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentRotate = this.targetRotate;
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
    this.currentRotate = this.config.defaultValue ?? 0;
    this.isActive = false;
    this.apply();
  }

  private apply(): void {
    this.element.style.transform = `rotate(${this.currentRotate}deg)`;
  }

  getValue(): number {
    return this.currentRotate;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
