import type { AtomContext } from '../atoms';

export interface WidthAtomConfig {
  value: number;
  trigger: 'hover' | 'click';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export class WidthAtom {
  readonly capability: 'width' = 'width';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: WidthAtomConfig;
  private currentWidth: string = 'auto';
  private isExpanded: boolean = true;
  private isActive: boolean = false;

  constructor(context: AtomContext, element: HTMLElement, config: WidthAtomConfig) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: true,
      toggleOnClick: true,
      ...config
    };
    this.apply();
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.currentWidth = `${this.config.value}px`;
      this.isActive = true;
    } else if (!this.config.keepOnRelease) {
      this.currentWidth = 'auto';
      this.isActive = false;
    }
    this.apply();
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.currentWidth = `${this.config.value}px`;
        this.isExpanded = true;
        this.isActive = true;
      } else {
        if (this.config.collapsedValue !== undefined) {
          this.currentWidth = `${this.config.collapsedValue}px`;
        } else {
          this.currentWidth = 'auto';
        }
        this.isExpanded = false;
        this.isActive = false;
      }
    } else {
      if (isClicked) {
        this.currentWidth = `${this.config.value}px`;
        this.isExpanded = true;
        this.isActive = true;
      } else if (!this.config.keepOnRelease) {
        if (this.config.collapsedValue !== undefined) {
          this.currentWidth = `${this.config.collapsedValue}px`;
        } else {
          this.currentWidth = 'auto';
        }
        this.isExpanded = false;
        this.isActive = false;
      }
    }
    this.apply();
  }

  toggle(): void {
    if (this.isExpanded) {
      if (this.config.collapsedValue !== undefined) {
        this.currentWidth = `${this.config.collapsedValue}px`;
      } else {
        this.currentWidth = 'auto';
      }
      this.isExpanded = false;
    } else {
      this.currentWidth = `${this.config.value}px`;
      this.isExpanded = true;
    }
    this.apply();
  }

  reset(): void {
    this.currentWidth = 'auto';
    this.isExpanded = true;
    this.isActive = false;
    this.apply();
  }

  private apply(): void {
    this.element.style.width = this.currentWidth;
  }

  getValue(): string {
    return this.currentWidth;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}