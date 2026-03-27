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

export class ResizeHandleAtom {
  readonly capability: 'resize-handle' = 'resize-handle';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: ResizeHandleAtomConfig;
  private callbacks: ResizeHandleInputCallbacks;

  constructor(context: AtomContext, element: HTMLElement, config: ResizeHandleAtomConfig, callbacks: ResizeHandleInputCallbacks) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.callbacks = callbacks;
    this.apply();
  }

  private apply(): void {
    try {
      const container = this.element;
      if (!container) return;

      const handle = document.createElement('div');
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

      container.appendChild(handle);
      this.setupResize(handle);
      console.log(`[Atom] ${this.context.bakerId} - ResizeHandleAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeHandleAtom应用失败:`, error);
    }
  }

  private setupResize(handle: HTMLElement): void {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    const minWidth = this.config.minWidth ?? 50;
    const minHeight = this.config.minHeight ?? 50;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = this.element.style.width ? parseFloat(this.element.style.width) : 100;
      startHeight = this.element.style.height ? parseFloat(this.element.style.height) : 100;
      this.callbacks.onResizeStart?.({ width: startWidth, height: startHeight });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (this.config.edge) {
        case 'se':
          newWidth = Math.max(minWidth, startWidth + dx);
          newHeight = Math.max(minHeight, startHeight + dy);
          break;
        case 'sw':
          newWidth = Math.max(minWidth, startWidth - dx);
          newHeight = Math.max(minHeight, startHeight + dy);
          break;
        case 'ne':
          newWidth = Math.max(minWidth, startWidth + dx);
          newHeight = Math.max(minHeight, startHeight - dy);
          break;
        case 'nw':
          newWidth = Math.max(minWidth, startWidth - dx);
          newHeight = Math.max(minHeight, startHeight - dy);
          break;
        default:
          newWidth = Math.max(minWidth, startWidth + dx);
          newHeight = Math.max(minHeight, startHeight + dy);
      }

      this.callbacks.onResize?.({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;
      const finalWidth = this.element.style.width ? parseFloat(this.element.style.width) : startWidth;
      const finalHeight = this.element.style.height ? parseFloat(this.element.style.height) : startHeight;
      this.callbacks.onResizeEnd?.({ width: finalWidth, height: finalHeight });
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