import type { AtomContext } from '../atoms';

export interface HeightAtomConfig {
  value: number;
  trigger: 'hover' | 'click';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export class HeightAtom {
  readonly capability: 'height' = 'height';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: HeightAtomConfig;
  private currentHeight: string = 'auto';
  private isExpanded: boolean = true;
  private isActive: boolean = false;

  constructor(context: AtomContext, element: HTMLElement, config: HeightAtomConfig) {
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
      this.currentHeight = `${this.config.value}px`;
      this.isActive = true;
    } else if (!this.config.keepOnRelease) {
      this.currentHeight = 'auto';
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
        this.currentHeight = `${this.config.value}px`;
        this.isExpanded = true;
        this.isActive = true;
      } else {
        if (this.config.collapsedValue !== undefined) {
          this.currentHeight = `${this.config.collapsedValue}px`;
        } else {
          this.currentHeight = 'auto';
        }
        this.isExpanded = false;
        this.isActive = false;
      }
    } else {
      if (isClicked) {
        this.currentHeight = `${this.config.value}px`;
        this.isExpanded = true;
        this.isActive = true;
      } else if (!this.config.keepOnRelease) {
        if (this.config.collapsedValue !== undefined) {
          this.currentHeight = `${this.config.collapsedValue}px`;
        } else {
          this.currentHeight = 'auto';
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
        this.currentHeight = `${this.config.collapsedValue}px`;
      } else {
        this.currentHeight = 'auto';
      }
      this.isExpanded = false;
    } else {
      this.currentHeight = `${this.config.value}px`;
      this.isExpanded = true;
    }
    this.apply();
  }

  reset(): void {
    this.currentHeight = 'auto';
    this.isExpanded = true;
    this.isActive = false;
    this.apply();
  }

  private apply(): void {
    this.element.style.height = this.currentHeight;
  }

  getValue(): string {
    return this.currentHeight;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}