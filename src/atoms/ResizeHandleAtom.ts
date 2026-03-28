import type { AtomContext } from '../atoms';

export interface ResizeHandleAtomConfig {
  id: string;
}

export class ResizeHandleAtom {
  readonly capability: 'resize-handle' = 'resize-handle';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private handle: HTMLElement | null = null;
  private decorationElements: HTMLElement[] = [];

  constructor(context: AtomContext, element: HTMLElement, config: ResizeHandleAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.findDecorations();
    this.createHandle();
  }

  private findDecorations(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const atomId = child.getAttribute('data-atom-id');
      if (atomId && (atomId.startsWith('bg-') || atomId.startsWith('border-') || atomId.startsWith('shadow-'))) {
        this.decorationElements.push(child);
      }
    }
  }

  private createHandle(): void {
    this.handle = document.createElement('div');
    this.handle.setAttribute('data-atom-id', this.id);
    this.handle.style.cssText = `
      position: absolute;
      right: 0;
      bottom: 0;
      width: 20px;
      height: 20px;
      cursor: se-resize;
      z-index: 1000;
      pointer-events: auto;
      background: transparent;
      overflow: hidden;
    `;

    const dots = [
      { x: 14, y: 14 },
      { x: 10, y: 14 },
      { x: 14, y: 10 },
      { x: 6, y: 14 },
      { x: 10, y: 10 },
      { x: 14, y: 6 },
    ];

    dots.forEach(pos => {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: 3px;
        height: 3px;
        background: #888;
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
    let startMouseX = 0;
    let startMouseY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startWidth = this.element.offsetWidth;
      startHeight = this.element.offsetHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      const newWidth = Math.max(50, startWidth + dx);
      const newHeight = Math.max(50, startHeight + dy);
      
      this.decorationElements.forEach(el => {
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
      });
      
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
    };

    this.handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}
