import type { AtomContext } from '../atoms';

export interface DragInputCallbacks {
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
  private element: HTMLElement;
  private config: DragAtomConfig;
  private callbacks: DragInputCallbacks;

  constructor(context: AtomContext, element: HTMLElement, config: DragAtomConfig, callbacks: DragInputCallbacks) {
    this.context = context;
    this.element = element;
    this.config = config;
    this.callbacks = callbacks;
    this.apply();
  }

  private apply(): void {
    try {
      const handle = this.config.handle ?? this.element;
      let isDragging = false;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        this.callbacks.onDragStart?.({ clientX: e.clientX, clientY: e.clientY });
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        this.callbacks.onDragMove?.({ clientX: e.clientX, clientY: e.clientY });
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        this.callbacks.onDragEnd?.();
      };

      handle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      console.log(`[Atom] ${this.context.bakerId} - DragAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - DragAtom应用失败:`, error);
    }
  }
}
