import type { AtomContext } from '../atoms';

export interface WidthAtomConfig {
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
}

interface OriginalCSS {
  left: number;
  top: number;
  width: number;
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
}

export class WidthAtom {
  readonly capability: 'width' = 'width';
  readonly context: AtomContext;
  private element: HTMLElement;
  private config: WidthAtomConfig;
  private originalWidth: number;
  private collapsedWidth: number;
  private currentWidth: number;
  private targetWidth: number = 0;
  private startWidth: number = 0;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private isExpanded: boolean = true;
  private originalStyles: Map<HTMLElement, OriginalCSS> = new Map();

  constructor(context: AtomContext, element: HTMLElement, config: WidthAtomConfig) {
    this.context = context;
    this.element = element;
    this.config = {
      keepOnRelease: true,
      toggleOnClick: true,
      duration: 0.15,
      ...config
    };
    this.originalWidth = element.offsetWidth;
    this.collapsedWidth = this.config.collapsedValue ?? 0;
    this.currentWidth = this.originalWidth;
    this.saveOriginalStyles();
  }

  private saveOriginalStyles(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const style = child.style;
      const { width, style: borderStyle, color: borderColor } = this.parseBorder(style.border);
      const boxShadowParts = this.parseBoxShadow(style.boxShadow);

      this.originalStyles.set(child, {
        left: parseFloat(style.left) || 0,
        top: parseFloat(style.top) || 0,
        width: parseFloat(style.width) || child.offsetWidth || 0,
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
        boxShadowColor: boxShadowParts.color
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
      this.animateToWidth(this.config.value);
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
      this.animateToWidth(isOddClick ? this.config.value : this.collapsedWidth);
    } else {
      if (isClicked) {
        this.isExpanded = true;
        this.animateToWidth(this.config.value);
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
    this.animateToWidth(isOddClick ? this.config.value : this.collapsedWidth);
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
    const scale = this.currentWidth / this.config.value;
    this.element.style.width = `${this.currentWidth}px`;
    this.element.style.overflow = 'hidden';

    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const original = this.originalStyles.get(child);
      if (!original) continue;

      child.style.left = `${original.left * scale}px`;
      child.style.top = `${original.top * scale}px`;
      child.style.width = `${original.width * scale}px`;
      child.style.height = `${original.height * scale}px`;
      child.style.fontSize = `${original.fontSize * scale}px`;
      child.style.borderRadius = `${original.borderRadius * scale}px`;

      if (original.borderWidth > 0) {
        child.style.border = `${original.borderWidth * scale}px ${original.borderStyle} ${original.borderColor}`;
      }

      const hasBoxShadow = original.boxShadowX !== 0 || original.boxShadowY !== 0 || original.boxShadowBlur !== 0 || original.boxShadowSpread !== 0;
      if (hasBoxShadow) {
        child.style.boxShadow = `${original.boxShadowX * scale}px ${original.boxShadowY * scale}px ${original.boxShadowBlur * scale}px ${original.boxShadowSpread * scale}px ${original.boxShadowColor}`;
      }
    }
  }

  reset(): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.currentWidth = this.config.value;
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
