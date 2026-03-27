import type { AtomContext } from '../atoms';

export interface ResizeHandleAtomConfig {
  id: string;
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  defaultValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
  duration?: number;
  handleSize?: number;
  handleColor?: [number, number, number];
  minWidth?: number;
  minHeight?: number;
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

export class ResizeHandleAtom {
  readonly capability: 'resize-handle' = 'resize-handle';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: ResizeHandleAtomConfig;
  private currentScale: number = 1;
  private targetScale: number = 1;
  private startScale: number = 1;
  private animationId: number = 0;
  private animationStartTime: number = 0;
  private originalStyles: Map<HTMLElement, OriginalCSS> = new Map();
  private isActive: boolean = false;
  private handle: HTMLElement | null = null;
  private originalWidth: number = 0;
  private originalHeight: number = 0;

  constructor(context: AtomContext, element: HTMLElement, config: ResizeHandleAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      defaultValue: 1,
      keepOnRelease: false,
      toggleOnClick: true,
      duration: 0.15,
      handleSize: 10,
      handleColor: [200, 200, 200],
      minWidth: 50,
      minHeight: 50,
      ...config
    };
    this.originalWidth = element.offsetWidth;
    this.originalHeight = element.offsetHeight;
    this.saveOriginalStyles();
    this.createHandle();
    this.apply();
  }

  private saveOriginalStyles(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child === this.handle) continue;
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

  private createHandle(): void {
    // 检查是否已经有把手
    const existingHandle = this.element.querySelector('[data-atom-id="' + this.id + '"]');
    if (existingHandle) return;
    
    this.handle = document.createElement('div');
    this.handle.setAttribute('data-atom-id', this.id);
    const color = this.config.handleColor ?? [180, 180, 180];
    this.handle.style.cssText = `
      position: absolute;
      right: 0;
      bottom: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
      z-index: 1000;
      pointer-events: auto;
      background: transparent;
      overflow: hidden;
    `;
    
    // 创建斜向点阵（类似macOS/Windows的缩放把手）
    // 3x3网格，只显示右下角的6个点
    const dots = [
      { x: 10, y: 10 }, // 右下角
      { x: 6, y: 10 },  // 中下
      { x: 10, y: 6 },  // 右中
      { x: 2, y: 10 },  // 左下
      { x: 6, y: 6 },   // 中心
      { x: 10, y: 2 },  // 右上
    ];
    
    dots.forEach(pos => {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: 2px;
        height: 2px;
        background: rgb(${color[0]}, ${color[1]}, ${color[2]});
        border-radius: 50%;
      `;
      this.handle.appendChild(dot);
    });
    
    this.element.appendChild(this.handle);
    this.setupDrag();
  }

  private setupDrag(): void {
    if (!this.handle) return;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startScale = 1;
    const minWidth = this.config.minWidth ?? 50;
    const minHeight = this.config.minHeight ?? 50;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startScale = this.currentScale;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const delta = Math.max(dx, dy);
      const newWidth = Math.max(minWidth, this.originalWidth * startScale + delta);
      const newHeight = Math.max(minHeight, this.originalHeight * startScale + delta);
      this.currentScale = Math.min(newWidth / this.originalWidth, newHeight / this.originalHeight);
      this.element.style.width = `${this.originalWidth * this.currentScale}px`;
      this.element.style.height = `${this.originalHeight * this.currentScale}px`;
      this.apply();
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
    };

    this.handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onHoverChange(isHovered: boolean): void {
    if (this.config.trigger !== 'hover') return;
    if (isHovered) {
      this.isActive = true;
      this.animateToScale(this.config.value);
    } else if (!this.config.keepOnRelease) {
      this.isActive = false;
      this.animateToScale(this.config.defaultValue ?? 1);
    }
  }

  onClickChange(isClicked: boolean, clickCount: number): void {
    if (this.config.trigger !== 'click') return;

    if (this.config.toggleOnClick) {
      if (!isClicked) return;
      const isOddClick = clickCount % 2 === 1;
      if (isOddClick) {
        this.isActive = true;
        this.animateToScale(this.config.value);
      } else {
        this.isActive = false;
        this.animateToScale(this.config.defaultValue ?? 1);
      }
    } else {
      if (isClicked) {
        this.isActive = true;
        this.animateToScale(this.config.value);
      } else if (!this.config.keepOnRelease) {
        this.isActive = false;
        this.animateToScale(this.config.defaultValue ?? 1);
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
        this.animateToScale(this.config.value);
      } else {
        this.isActive = false;
        this.animateToScale(this.config.defaultValue ?? 1);
      }
    } else {
      this.isActive = true;
      this.animateToScale(this.config.value);
    }
  }

  private animateToScale(targetScale: number): void {
    if (this.animationId !== 0) {
      cancelAnimationFrame(this.animationId);
    }
    this.startScale = this.currentScale;
    this.targetScale = targetScale;
    this.animationStartTime = performance.now();
    const duration = (this.config.duration ?? 0.15) * 1000;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      this.currentScale = this.startScale + (this.targetScale - this.startScale) * eased;
      this.element.style.width = `${this.originalWidth * this.currentScale}px`;
      this.element.style.height = `${this.originalHeight * this.currentScale}px`;
      this.apply();
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = 0;
        this.currentScale = this.targetScale;
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
    this.currentScale = this.config.defaultValue ?? 1;
    this.isActive = false;
    this.element.style.width = `${this.originalWidth * this.currentScale}px`;
    this.element.style.height = `${this.originalHeight * this.currentScale}px`;
    this.apply();
  }

  private apply(): void {
    const scale = this.currentScale;
    const containerCenterX = this.originalWidth / 2;
    const containerCenterY = this.originalHeight / 2;
    const children = this.element.children;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child === this.handle) continue;
      const original = this.originalStyles.get(child);
      if (!original) continue;

      const childCenterX = original.left + original.width / 2;
      const childCenterY = original.top + original.height / 2;
      const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scale;
      const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scale;

      child.style.left = `${newChildCenterX - original.width * scale / 2}px`;
      child.style.top = `${newChildCenterY - original.height * scale / 2}px`;
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

  getValue(): number {
    return this.currentScale;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
