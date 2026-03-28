import type { AtomContext } from '../atoms';

export interface ResizeInputCallbacks {
  onResizeStart?: (size: { width: number; height: number }) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onResizeEnd?: (size: { width: number; height: number }) => void;
}

export interface ResizeAtomConfig {
  id: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class ResizeAtom {
  readonly capability: 'resize' = 'resize';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: ResizeAtomConfig;
  private callbacks: ResizeInputCallbacks;
  private startWidth: number = 0;
  private startHeight: number = 0;
  private onMouseDownHandler: ((e: Event) => void) | null = null;
  private onMouseMoveHandler: ((e: Event) => void) | null = null;
  private onMouseUpHandler: (() => void) | null = null;
  private isResizing: boolean = false;

  constructor(context: AtomContext, element: HTMLElement, config: ResizeAtomConfig, callbacks: ResizeInputCallbacks) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.callbacks = callbacks;
    this.startWidth = element.style.width ? parseFloat(element.style.width) : 100;
    this.startHeight = element.style.height ? parseFloat(element.style.height) : 100;
    this.apply();
  }

  private apply(): void {
    try {
      let startX = 0;
      let startY = 0;
      const minWidth = this.config.minWidth ?? 20;
      const minHeight = this.config.minHeight ?? 20;
      const maxWidth = this.config.maxWidth ?? Infinity;
      const maxHeight = this.config.maxHeight ?? Infinity;

      this.onMouseDownHandler = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        if (mouseEvent.button !== 0) return;
        mouseEvent.preventDefault();
        this.isResizing = true;
        startX = mouseEvent.clientX;
        startY = mouseEvent.clientY;
        this.startWidth = this.element.style.width ? parseFloat(this.element.style.width) : 100;
        this.startHeight = this.element.style.height ? parseFloat(this.element.style.height) : 100;
        this.callbacks.onResizeStart?.({ width: this.startWidth, height: this.startHeight });
      };

      this.onMouseMoveHandler = (e: Event) => {
        if (!this.isResizing) return;
        const mouseEvent = e as MouseEvent;

        const dx = mouseEvent.clientX - startX;
        const dy = mouseEvent.clientY - startY;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, this.startWidth + dx));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, this.startHeight + dy));

        this.callbacks.onResize?.({ width: newWidth, height: newHeight });
      };

      this.onMouseUpHandler = () => {
        if (!this.isResizing) return;
        this.isResizing = false;
        const finalWidth = this.element.style.width ? parseFloat(this.element.style.width) : this.startWidth;
        const finalHeight = this.element.style.height ? parseFloat(this.element.style.height) : this.startHeight;
        this.callbacks.onResizeEnd?.({ width: finalWidth, height: finalHeight });
      };

      this.element.addEventListener('mousedown', this.onMouseDownHandler);
      document.addEventListener('mousemove', this.onMouseMoveHandler);
      document.addEventListener('mouseup', this.onMouseUpHandler);
      console.log(`[Atom] ${this.context.bakerId} - ResizeAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeAtom应用失败:`, error);
    }
  }

  destroy(): void {
    if (this.onMouseDownHandler) {
      this.element.removeEventListener('mousedown', this.onMouseDownHandler);
    }
    if (this.onMouseMoveHandler) {
      document.removeEventListener('mousemove', this.onMouseMoveHandler);
    }
    if (this.onMouseUpHandler) {
      document.removeEventListener('mouseup', this.onMouseUpHandler);
    }
    this.onMouseDownHandler = null;
    this.onMouseMoveHandler = null;
    this.onMouseUpHandler = null;
    console.log(`[Atom] ${this.context.bakerId} - ResizeAtom已销毁`);
  }
}
