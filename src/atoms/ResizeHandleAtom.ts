import type { AtomContext } from '../atoms';

export interface ResizeHandleInputCallbacks {
  onResizeStart?: (size: { width: number; height: number }) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onResizeEnd?: (size: { width: number; height: number }) => void;
}

export interface ResizeHandleAtomConfig {
  id: string;
  edge?: 'nw' | 'ne' | 'sw' | 'se';
  minWidth?: number;
  minHeight?: number;
  handleSize?: number;
  handleColor?: [number, number, number];
  scaleMode?: 'container' | 'proportional';
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
  isDecoration: boolean;
}

export class ResizeHandleAtom {
  readonly capability: 'resize-handle' = 'resize-handle';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: ResizeHandleAtomConfig;
  private callbacks: ResizeHandleInputCallbacks;
  private originalStyles: Map<HTMLElement, OriginalCSS> = new Map();
  private originalWidth: number = 0;
  private originalHeight: number = 0;
  private currentScaleX: number = 1;
  private currentScaleY: number = 1;

  constructor(context: AtomContext, element: HTMLElement, config: ResizeHandleAtomConfig, callbacks: ResizeHandleInputCallbacks) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = {
      scaleMode: 'proportional',
      ...config
    };
    this.callbacks = callbacks;
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
      const style = child.style;
      const { width, style: borderStyle, color: borderColor } = this.parseBorder(style.border);
      const boxShadowParts = this.parseBoxShadow(style.boxShadow);
      const atomId = child.getAttribute('data-atom-id') || '';
      const isDecoration = atomId.startsWith('bg-') || atomId.startsWith('border-') || atomId.startsWith('shadow-');

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
        boxShadowColor: boxShadowParts.color,
        isDecoration: isDecoration
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
    try {
      const handle = document.createElement('div');
      handle.setAttribute('data-atom-id', this.id);
      const size = this.config.handleSize ?? 10;
      handle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgb(${this.config.handleColor?.[0] ?? 200}, ${this.config.handleColor?.[1] ?? 200}, ${this.config.handleColor?.[2] ?? 200});
        cursor: ${this.getCursor(this.config.edge)};
      `;

      switch (this.config.edge) {
        case 'se':
          handle.style.right = '0';
          handle.style.bottom = '0';
          break;
        case 'sw':
          handle.style.left = '0';
          handle.style.bottom = '0';
          break;
        case 'ne':
          handle.style.right = '0';
          handle.style.top = '0';
          break;
        case 'nw':
          handle.style.left = '0';
          handle.style.top = '0';
          break;
        default:
          handle.style.right = '0';
          handle.style.bottom = '0';
      }

      this.element.appendChild(handle);
      console.log(`[Atom] ${this.context.bakerId} - ResizeHandleAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeHandleAtom创建失败:`, error);
    }
  }

  private apply(): void {
    const scaleX = this.currentScaleX;
    const scaleY = this.currentScaleY;
    const scale = Math.min(scaleX, scaleY);
    const containerCenterX = this.originalWidth / 2;
    const containerCenterY = this.originalHeight / 2;
    const children = this.element.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const original = this.originalStyles.get(child);
      if (!original) continue;

      if (this.config.scaleMode === 'proportional') {
        const childCenterX = original.left + original.width / 2;
        const childCenterY = original.top + original.height / 2;
        const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scaleX;
        const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scaleY;

        child.style.left = `${newChildCenterX - original.width * scaleX / 2}px`;
        child.style.top = `${newChildCenterY - original.height * scaleY / 2}px`;
        child.style.width = `${original.width * scaleX}px`;
        child.style.height = `${original.height * scaleY}px`;
        child.style.fontSize = `${original.fontSize * scale}px`;
        child.style.borderRadius = `${original.borderRadius * scale}px`;

        if (original.borderWidth > 0) {
          child.style.border = `${original.borderWidth * scale}px ${original.borderStyle} ${original.borderColor}`;
        }

        const hasBoxShadow = original.boxShadowX !== 0 || original.boxShadowY !== 0 || original.boxShadowBlur !== 0 || original.boxShadowSpread !== 0;
        if (hasBoxShadow) {
          child.style.boxShadow = `${original.boxShadowX * scale}px ${original.boxShadowY * scale}px ${original.boxShadowBlur * scale}px ${original.boxShadowSpread * scale}px ${original.boxShadowColor}`;
        }
      } else {
        if (original.isDecoration) {
          const childCenterX = original.left + original.width / 2;
          const childCenterY = original.top + original.height / 2;
          const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scaleX;
          const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scaleY;

          child.style.left = `${newChildCenterX - original.width * scaleX / 2}px`;
          child.style.top = `${newChildCenterY - original.height * scaleY / 2}px`;
          child.style.width = `${original.width * scaleX}px`;
          child.style.height = `${original.height * scaleY}px`;
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
    }
  }

  private setupResize(handle: HTMLElement): void {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startScaleX = 1;
    let startScaleY = 1;
    const minWidth = this.config.minWidth ?? 50;
    const minHeight = this.config.minHeight ?? 50;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startScaleX = this.currentScaleX;
      startScaleY = this.currentScaleY;
      this.callbacks.onResizeStart?.({
        width: this.originalWidth * this.currentScaleX,
        height: this.originalHeight * this.currentScaleY
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newWidth = this.originalWidth * startScaleX;
      let newHeight = this.originalHeight * startScaleY;

      switch (this.config.edge) {
        case 'se':
          newWidth = Math.max(minWidth, newWidth + dx);
          newHeight = Math.max(minHeight, newHeight + dy);
          break;
        case 'sw':
          newWidth = Math.max(minWidth, newWidth - dx);
          newHeight = Math.max(minHeight, newHeight + dy);
          break;
        case 'ne':
          newWidth = Math.max(minWidth, newWidth + dx);
          newHeight = Math.max(minHeight, newHeight - dy);
          break;
        case 'nw':
          newWidth = Math.max(minWidth, newWidth - dx);
          newHeight = Math.max(minHeight, newHeight - dy);
          break;
        default:
          newWidth = Math.max(minWidth, newWidth + dx);
          newHeight = Math.max(minHeight, newHeight + dy);
      }

      this.currentScaleX = newWidth / this.originalWidth;
      this.currentScaleY = newHeight / this.originalHeight;
      this.apply();
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;

      this.callbacks.onResize?.({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;
      this.callbacks.onResizeEnd?.({
        width: this.originalWidth * this.currentScaleX,
        height: this.originalHeight * this.currentScaleY
      });
    };

    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private getCursor(edge?: string): string {
    switch (edge) {
      case 'se': return 'se-resize';
      case 'sw': return 'sw-resize';
      case 'ne': return 'ne-resize';
      case 'nw': return 'nw-resize';
      default: return 'se-resize';
    }
  }
}
