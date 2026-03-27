import type { AtomContext } from '../atoms';

export interface ImageAtomConfig {
  id: string;
  src: string;
  width: number;
  height: number;
  alt?: string;
  position?: { x: number; y: number; z?: number };
  fitMode?: 'scroll' | 'crop' | 'stretch';
  offsetX?: number;
  offsetY?: number;
}

export class ImageAtom {
  readonly capability: 'image' = 'image';
  readonly context: AtomContext;
  readonly id: string;

  private imageElement?: HTMLImageElement;
  private containerWidth = 0;
  private containerHeight = 0;
  private imageNaturalWidth = 0;
  private imageNaturalHeight = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private currentOffsetX = 0;
  private currentOffsetY = 0;

  constructor(context: AtomContext, container: HTMLElement, config: ImageAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: ImageAtomConfig): void {
    try {
      const fitMode = config.fitMode ?? 'scroll';

      if (fitMode === 'stretch') {
        this.renderStretch(container, config);
      } else {
        this.renderWithContainer(container, config, fitMode);
      }

      console.log(`[Atom] ${this.context.bakerId} - ImageAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ImageAtom渲染失败:`, error);
    }
  }

  private renderStretch(container: HTMLElement, config: ImageAtomConfig): void {
    const element = document.createElement('img');
    element.src = config.src;
    element.width = config.width;
    element.height = config.height;
    if (config.alt) element.alt = config.alt;
    element.style.cssText = `
      position: absolute;
      left: ${config.position?.x ?? 0}px;
      top: ${config.position?.y ?? 0}px;
      width: ${config.width}px;
      height: ${config.height}px;
      object-fit: fill;
    `;
    container.appendChild(element);
    this.imageElement = element;
  }

  private renderWithContainer(container: HTMLElement, config: ImageAtomConfig, fitMode: 'scroll' | 'crop'): void {
    const scrollContainer = document.createElement('div');
    const initialOffsetX = config.offsetX ?? 0;
    const initialOffsetY = config.offsetY ?? 0;

    this.containerWidth = config.width;
    this.containerHeight = config.height;

    scrollContainer.style.cssText = `
      position: absolute;
      left: ${config.position?.x ?? 0}px;
      top: ${config.position?.y ?? 0}px;
      width: ${config.width}px;
      height: ${config.height}px;
      overflow: hidden;
    `;

    const element = document.createElement('img');
    element.src = config.src;
    if (config.alt) element.alt = config.alt;

    if (fitMode === 'crop') {
      element.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      scrollContainer.appendChild(element);
      container.appendChild(scrollContainer);
      this.imageElement = element;
    } else {
      element.style.cssText = `
        position: absolute;
        left: ${initialOffsetX}px;
        top: ${initialOffsetY}px;
        cursor: grab;
        user-select: none;
        -webkit-user-drag: none;
      `;
      this.currentOffsetX = initialOffsetX;
      this.currentOffsetY = initialOffsetY;
      this.setupScrollHandlers(element);
      scrollContainer.appendChild(element);
      container.appendChild(scrollContainer);
      this.imageElement = element;
      element.onload = () => {
        this.imageNaturalWidth = element.naturalWidth;
        this.imageNaturalHeight = element.naturalHeight;
        this.clampOffset();
      };
    }
  }

  private clampOffset(): void {
    const maxOffsetX = 0;
    const minOffsetX = this.containerWidth - this.imageNaturalWidth;
    const maxOffsetY = 0;
    const minOffsetY = this.containerHeight - this.imageNaturalHeight;
    this.currentOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.currentOffsetX));
    this.currentOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.currentOffsetY));
    if (this.imageElement) {
      this.imageElement.style.left = `${this.currentOffsetX}px`;
      this.imageElement.style.top = `${this.currentOffsetY}px`;
    }
  }

  private setupScrollHandlers(element: HTMLImageElement): void {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.dragStartX = e.clientX - this.currentOffsetX;
      this.dragStartY = e.clientY - this.currentOffsetY;
      element.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      this.currentOffsetX = e.clientX - this.dragStartX;
      this.currentOffsetY = e.clientY - this.dragStartY;
      this.clampOffset();
      e.preventDefault();
    };

    const onMouseUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      element.style.cursor = 'grab';
    };

    const onMouseLeave = () => {
      this.isDragging = false;
      element.style.cursor = 'grab';
    };

    element.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mouseleave', onMouseLeave);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX - this.currentOffsetX;
      this.dragStartY = e.touches[0].clientY - this.currentOffsetY;
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      this.currentOffsetX = e.touches[0].clientX - this.dragStartX;
      this.currentOffsetY = e.touches[0].clientY - this.dragStartY;
      this.clampOffset();
      e.preventDefault();
    };

    const onTouchEnd = () => {
      this.isDragging = false;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  getOffset(): { x: number; y: number } {
    return { x: this.currentOffsetX, y: this.currentOffsetY };
  }

  setOffset(x: number, y: number): void {
    this.currentOffsetX = x;
    this.currentOffsetY = y;
    this.clampOffset();
  }
}
