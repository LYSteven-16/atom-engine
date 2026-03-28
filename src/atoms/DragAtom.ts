import type { AtomContext } from '../atoms';

export interface DragInputCallbacks {
  id: string;
  onDragStart?: (mouse: { clientX: number; clientY: number }) => void;
  onDragMove?: (mouse: { clientX: number; clientY: number }) => void;
  onDragEnd?: () => void;
}

export interface DragAtomConfig {
  handle?: HTMLElement;
}

export class DragAtom {
  readonly capability: 'drag' = 'drag';
  readonly context: AtomContext;
  readonly id: string;
  private callbacks: DragInputCallbacks;
  private handle: HTMLElement;
  private onMouseDownHandler: ((e: Event) => void) | null = null;
  private onMouseMoveHandler: ((e: Event) => void) | null = null;
  private onMouseUpHandler: (() => void) | null = null;
  private isDragging: boolean = false;

  constructor(context: AtomContext, _element: HTMLElement, config: DragAtomConfig, callbacks: DragInputCallbacks) {
    this.context = context;
    this.id = callbacks.id;
    this.callbacks = callbacks;
    this.handle = config.handle ?? _element;
    this.apply();
  }

  private apply(): void {
    try {
      this.onMouseDownHandler = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        if (mouseEvent.button !== 0) return;
        mouseEvent.preventDefault();
        this.isDragging = true;
        this.callbacks.onDragStart?.({ clientX: mouseEvent.clientX, clientY: mouseEvent.clientY });
      };

      this.onMouseMoveHandler = (e: Event) => {
        if (!this.isDragging) return;
        const mouseEvent = e as MouseEvent;
        this.callbacks.onDragMove?.({ clientX: mouseEvent.clientX, clientY: mouseEvent.clientY });
      };

      this.onMouseUpHandler = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.callbacks.onDragEnd?.();
      };

      this.handle.addEventListener('mousedown', this.onMouseDownHandler);
      document.addEventListener('mousemove', this.onMouseMoveHandler);
      document.addEventListener('mouseup', this.onMouseUpHandler);
      console.log(`[Atom] ${this.context.bakerId} - DragAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - DragAtom应用失败:`, error);
    }
  }

  destroy(): void {
    if (this.onMouseDownHandler) {
      this.handle.removeEventListener('mousedown', this.onMouseDownHandler);
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
    console.log(`[Atom] ${this.context.bakerId} - DragAtom已销毁`);
  }
}
