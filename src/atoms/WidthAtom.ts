import type { AtomContext } from '../atoms';

export interface WidthAtomConfig {
  id: string;
  collapsedValue: number;
  moleculeWidth: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  hiddenAtomIds?: string[];  // 折叠后要隐藏的原子id
  fixedAtomIds?: string[];   // 不会被缩放和隐藏的原子id
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

interface OriginalCSS {
  left: number;
  width: number;
  fontSize: number;
  isText: boolean;
  atomId: string;  // 子元素对应的原子id
}

export class WidthAtom {
  readonly capability: 'width' = 'width';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: WidthAtomConfig;
  private collapsedWidth: number;
  private expandedWidth: number;
  private currentWidth: number;
  private targetWidth: number = 0;
  private startWidth: number = 0;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isExpanded: boolean = false;
  private originalStyles: Map<HTMLElement, OriginalCSS> = new Map();

  constructor(context: AtomContext, element: HTMLElement, config: WidthAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      id: config.id,
      keepOnRelease: config.keepOnRelease ?? false,
      toggleOnClick: config.toggleOnClick ?? true,
      duration: config.duration ?? 0.15,
      collapsedValue: config.collapsedValue,
      moleculeWidth: config.moleculeWidth,
      trigger: config.trigger,
      hiddenAtomIds: config.hiddenAtomIds,
      fixedAtomIds: config.fixedAtomIds
    };
    this.collapsedWidth = this.config.collapsedValue;
    this.expandedWidth = this.config.moleculeWidth;
    this.currentWidth = this.collapsedWidth;
    this.isExpanded = false;
    this.saveOriginalStyles();
    this.apply();
  }

  private saveOriginalStyles(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const style = child.style;
      const isText = child.tagName === 'DIV' && child.textContent && !child.querySelector('canvas, img, video, audio');
      const atomId = child.getAttribute('data-atom-id') || '';

      this.originalStyles.set(child, {
        left: parseFloat(style.left) || 0,
        width: parseFloat(style.width) || child.offsetWidth || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0,
        isText: !!isText,
        atomId: atomId
      });
    }
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.isExpanded = true;
      this.animateToWidth(this.expandedWidth);
    } else if (!this.config.keepOnRelease) {
      this.isExpanded = false;
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
    const scaleX = this.currentWidth / this.expandedWidth;
    const hiddenAtomIds = this.config.hiddenAtomIds || [];
    const fixedAtomIds = this.config.fixedAtomIds || [];
    this.element.style.width = `${this.currentWidth}px`;
    // 圆角不参与缩放，保持原样

    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const original = this.originalStyles.get(child);
      if (!original) continue;

      // fixed原子：不缩放、不隐藏
      if (fixedAtomIds.includes(original.atomId)) {
        continue;
      }

      // 所有元素都改变宽度和位置
      child.style.left = `${original.left * scaleX}px`;
      child.style.width = `${original.width * scaleX}px`;

      // 文字元素额外改变字号
      if (original.isText) {
        child.style.fontSize = `${original.fontSize * scaleX}px`;
      }

      // 隐藏原子：先缩小，再渐隐
      if (hiddenAtomIds.includes(original.atomId)) {
        // 计算渐隐进度：从展开到折叠的过程中，opacity 从 1 变到 0
        const progress = (this.currentWidth - this.collapsedWidth) / (this.expandedWidth - this.collapsedWidth);
        const opacity = Math.max(0, Math.min(1, progress));
        child.style.opacity = `${opacity}`;
        child.style.pointerEvents = opacity < 0.3 ? 'none' : 'auto';
      }
    }
  }

  reset(): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentWidth = this.collapsedWidth;
    this.isExpanded = false;
    this.apply();
  }

  getValue(): number {
    return this.currentWidth;
  }

  getIsExpanded(): boolean {
    return this.isExpanded;
  }
}
