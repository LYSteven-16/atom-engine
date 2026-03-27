import type { AtomContext } from '../atoms';

export interface HeightAtomConfig {
  id: string;
  collapsedValue: number;
  moleculeHeight: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  hiddenAtomIds?: string[];  // 折叠后要隐藏的原子id
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

interface OriginalCSS {
  top: number;
  height: number;
  fontSize: number;
  borderRadius: number;
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  boxShadowX: number;
  boxShadowY: number;
  boxShadowBlur: number;
  boxShadowSpread: number;
  boxShadowColor: string;
  isText: boolean;
  atomId: string;  // 子元素对应的原子id
}

export class HeightAtom {
  readonly capability: 'height' = 'height';
  readonly context: AtomContext;
  readonly id: string;
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
  private originalBorderRadius: number = 0;

  constructor(context: AtomContext, element: HTMLElement, config: HeightAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      id: config.id,
      keepOnRelease: config.keepOnRelease ?? false,
      toggleOnClick: config.toggleOnClick ?? true,
      duration: config.duration ?? 0.15,
      collapsedValue: config.collapsedValue,
      moleculeHeight: config.moleculeHeight,
      trigger: config.trigger,
      hiddenAtomIds: config.hiddenAtomIds
    };
    this.collapsedHeight = this.config.collapsedValue;
    this.expandedHeight = this.config.moleculeHeight;
    this.currentHeight = this.collapsedHeight;
    this.originalBorderRadius = parseFloat(element.style.borderRadius) || 0;
    this.saveOriginalStyles();
    this.apply();
  }

  private saveOriginalStyles(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const style = child.style;
      const isText = child.tagName === 'DIV' && child.textContent && !child.querySelector('canvas, img, video, audio');
      const { width, style: borderStyle, color: borderColor } = this.parseBorder(style.border);
      const boxShadowParts = this.parseBoxShadow(style.boxShadow);
      const atomId = child.getAttribute('data-atom-id') || '';

      this.originalStyles.set(child, {
        top: parseFloat(style.top) || 0,
        height: parseFloat(style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0,
        borderRadius: parseFloat(style.borderRadius) || 0,
        borderWidth: width,
        borderStyle: borderStyle,
        borderColor: borderColor,
        boxShadowX: boxShadowParts.x,
        boxShadowY: boxShadowParts.y,
        boxShadowBlur: boxShadowParts.blur,
        boxShadowSpread: boxShadowParts.spread,
        boxShadowColor: boxShadowParts.color,
        isText: !!isText,
        atomId: atomId
      });
    }
  }

  private parseBorder(border: string): { width: number; style: string; color: string } {
    if (!border || border === 'transparent' || border === 'none') {
      return { width: 0, style: 'none', color: 'transparent' };
    }
    const parts = border.split(' ');
    let width = 0;
    let style = 'solid';
    let color = 'rgb(0, 0, 0)';

    for (const part of parts) {
      if (part.endsWith('px')) {
        width = parseFloat(part);
      } else if (['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none', 'hidden'].includes(part)) {
        style = part;
      } else if (part.startsWith('rgb') || part.startsWith('#') || part === 'transparent') {
        color = part;
      }
    }

    return { width, style, color };
  }

  private parseBoxShadow(boxShadow: string): { x: number; y: number; blur: number; spread: number; color: string } {
    if (!boxShadow || boxShadow === 'none' || boxShadow === 'transparent') {
      return { x: 0, y: 0, blur: 0, spread: 0, color: 'rgba(0, 0, 0, 0.5)' };
    }
    const parts = boxShadow.split(' ');
    if (parts.length >= 5) {
      return {
        x: parseFloat(parts[0]) || 0,
        y: parseFloat(parts[1]) || 0,
        blur: parseFloat(parts[2]) || 0,
        spread: parseFloat(parts[3]) || 0,
        color: parts.slice(4).join(' ')
      };
    }
    return { x: 0, y: 0, blur: 0, spread: 0, color: 'rgba(0, 0, 0, 0.5)' };
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
    const scaleY = this.currentHeight / this.expandedHeight;
    const hiddenAtomIds = this.config.hiddenAtomIds || [];
    this.element.style.height = `${this.currentHeight}px`;
    this.element.style.borderRadius = `${this.originalBorderRadius * scaleY}px`;

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

      // 圆角同步
      if (original.borderRadius > 0) {
        child.style.borderRadius = `${original.borderRadius * scaleY}px`;
      }

      // 边框同步
      if (original.borderWidth > 0) {
        child.style.border = `${original.borderWidth * scaleY}px ${original.borderStyle} ${original.borderColor}`;
      }

      // 阴影同步
      const hasBoxShadow = original.boxShadowX !== 0 || original.boxShadowY !== 0 || original.boxShadowBlur !== 0 || original.boxShadowSpread !== 0;
      if (hasBoxShadow) {
        child.style.boxShadow = `${original.boxShadowX * scaleY}px ${original.boxShadowY * scaleY}px ${original.boxShadowBlur * scaleY}px ${original.boxShadowSpread * scaleY}px ${original.boxShadowColor}`;
      }

      // 隐藏原子：先缩小，再渐隐
      if (hiddenAtomIds.includes(original.atomId)) {
        // scaleY > 0.5 时完全显示，< 0.5 时渐隐
        const opacity = scaleY > 0.5 ? 1 : scaleY * 2;
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
