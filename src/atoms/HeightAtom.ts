import type { AtomContext } from '../atoms';

export interface HeightAtomConfig {
  collapsedValue: number;
  moleculeHeight: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

interface OriginalCSS {
  top: number;
  height: number;
  fontSize: number;
  isText: boolean;
}

export class HeightAtom {
  readonly capability: 'height' = 'height';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: HeightAtomConfig;
  private collapsedHeight: number;
  private expandedHeight: number;
  private currentHeight: number;
  private targetHeight: number = 0;
  private startHeight: number = 0;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isExpanded: boolean = false;
  private originalStyles: Map<HTMLElement, OriginalCSS> = new Map();

  constructor(context: AtomContext, element: HTMLElement, config: HeightAtomConfig) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: config.keepOnRelease ?? false,
      toggleOnClick: config.toggleOnClick ?? true,
      duration: config.duration ?? 0.15,
      collapsedValue: config.collapsedValue,
      moleculeHeight: config.moleculeHeight,
      trigger: config.trigger
    };
    this.collapsedHeight = this.config.collapsedValue;
    this.expandedHeight = this.config.moleculeHeight;
    this.currentHeight = this.collapsedHeight;
    this.saveOriginalStyles();
    this.apply();
  }

  private saveOriginalStyles(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const style = child.style;
      const isText = child.tagName === 'DIV' && child.textContent && !child.querySelector('canvas, img, video, audio');

      this.originalStyles.set(child, {
        top: parseFloat(style.top) || 0,
        height: parseFloat(style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0,
        isText: !!isText
      });
    }
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
    console.log(`[HeightAtom] onClickChange: isClicked=${isClicked}, clickCount=${clickCount}, toggleOnClick=${this.config.toggleOnClick}, isExpanded=${this.isExpanded}`);

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      this.isExpanded = isOddClick;
      console.log(`[HeightAtom] isOddClick=${isOddClick}, targetHeight=${isOddClick ? this.expandedHeight : this.collapsedHeight}`);
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
    const scaleY = this.currentHeight / this.expandedHeight;
    this.element.style.height = `${this.currentHeight}px`;
    this.element.style.overflow = 'hidden';

    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const original = this.originalStyles.get(child);
      if (!original) continue;

      // 所有元素都改变高度和位置
      child.style.top = `${original.top * scaleY}px`;
      child.style.height = `${original.height * scaleY}px`;

      // 文字元素额外改变字号
      if (original.isText) {
        child.style.fontSize = `${original.fontSize * scaleY}px`;
      }
    }
  }

  reset(): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentHeight = this.collapsedHeight;
    this.isExpanded = false;
    this.apply();
  }

  getValue(): number {
    return this.currentHeight;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
