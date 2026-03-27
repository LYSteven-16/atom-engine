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
      let isResizing = false;
      let startX = 0;
      let startY = 0;
      const minWidth = this.config.minWidth ?? 20;
      const minHeight = this.config.minHeight ?? 20;
      const maxWidth = this.config.maxWidth ?? Infinity;
      const maxHeight = this.config.maxHeight ?? Infinity;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        this.startWidth = this.element.style.width ? parseFloat(this.element.style.width) : 100;
        this.startHeight = this.element.style.height ? parseFloat(this.element.style.height) : 100;
        this.callbacks.onResizeStart?.({ width: this.startWidth, height: this.startHeight });
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, this.startWidth + dx));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, this.startHeight + dy));

        this.callbacks.onResize?.({ width: newWidth, height: newHeight });
      };

      const onMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        const finalWidth = this.element.style.width ? parseFloat(this.element.style.width) : this.startWidth;
        const finalHeight = this.element.style.height ? parseFloat(this.element.style.height) : this.startHeight;
        this.callbacks.onResizeEnd?.({ width: finalWidth, height: finalHeight });
      };

      this.element.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      console.log(`[Atom] ${this.context.bakerId} - ResizeAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeAtom应用失败:`, error);
    }
  }
}