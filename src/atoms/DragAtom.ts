import type { AtomContext } from '../atoms';

export interface DragInputCallbacks {
  onDragStart?: (pos: { x: number; y: number }) => void;
  onDragMove?: (pos: { x: number; y: number }) => void;
  onDragEnd?: () => void;
}

export interface DragAtomConfig {
  handle?: HTMLElement;
  bounds?: { x: number; y: number; width: number; height: number };
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
      let startX = 0;
      let startY = 0;
      let elementStartX = 0;
      let elementStartY = 0;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        elementStartX = parseFloat(this.element.style.left) || 0;
        elementStartY = parseFloat(this.element.style.top) || 0;
        this.callbacks.onDragStart?.({ x: elementStartX, y: elementStartY });
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newX = elementStartX + dx;
        let newY = elementStartY + dy;

        if (this.config.bounds) {
          const width = this.element.style.width ? parseFloat(this.element.style.width) : 0;
          const height = this.element.style.height ? parseFloat(this.element.style.height) : 0;
          newX = Math.max(this.config.bounds.x, Math.min(newX, this.config.bounds.x + this.config.bounds.width - width));
          newY = Math.max(this.config.bounds.y, Math.min(newY, this.config.bounds.y + this.config.bounds.height - height));
        }

        this.callbacks.onDragMove?.({ x: newX, y: newY });
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