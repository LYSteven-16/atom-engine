import type { AtomContext } from '../atoms';

export interface ResizeHandleAtomConfig {
  id: string;
  targetAtomIds?: string[];  // 只更新尺寸的原子
  fixedAtomIds?: string[];   // 不做任何修改的原子
}

interface OriginalStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}

export class ResizeHandleAtom {
  readonly capability: 'resize-handle' = 'resize-handle';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private handle: HTMLElement | null = null;
  private targetElements: HTMLElement[] = [];
  private fixedElementIds: string[] = [];
  private originalStyles: Map<HTMLElement, OriginalStyle> = new Map();
  private originalWidth: number = 0;
  private originalHeight: number = 0;

  constructor(context: AtomContext, element: HTMLElement, config: ResizeHandleAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.originalWidth = element.offsetWidth;
    this.originalHeight = element.offsetHeight;
    this.fixedElementIds = config.fixedAtomIds || [];
    this.findTargets(config.targetAtomIds || []);
    this.saveOriginalStyles();
    this.createHandle();
  }

  private findTargets(targetAtomIds: string[]): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const atomId = child.getAttribute('data-atom-id');
      if (atomId && targetAtomIds.includes(atomId)) {
        this.targetElements.push(child);
      }
    }
  }

  private saveOriginalStyles(): void {
    const children = this.element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      this.originalStyles.set(child, {
        left: parseFloat(child.style.left) || 0,
        top: parseFloat(child.style.top) || 0,
        width: parseFloat(child.style.width) || child.offsetWidth || 0,
        height: parseFloat(child.style.height) || child.offsetHeight || 0,
        fontSize: parseFloat(child.style.fontSize) || parseFloat(getComputedStyle(child).fontSize) || 0
      });
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
      
      // 更新容器尺寸
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
      
      // 更新target原子尺寸
      this.targetElements.forEach((el: HTMLElement) => {
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
      });
      
      // 更新其他原子（等比缩放）
      const scaleX = newWidth / this.originalWidth;
      const scaleY = newHeight / this.originalHeight;
      const containerCenterX = this.originalWidth / 2;
      const containerCenterY = this.originalHeight / 2;
      
      const children = this.element.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (child === this.handle) continue;
        
        const atomId = child.getAttribute('data-atom-id') || '';
        
        // 跳过target原子和fixed原子
        if (this.targetElements.includes(child)) continue;
        if (this.fixedElementIds.includes(atomId)) continue;
        
        const original = this.originalStyles.get(child);
        if (!original) continue;
        
        // 等比缩放
        const childCenterX = original.left + original.width / 2;
        const childCenterY = original.top + original.height / 2;
        const newChildCenterX = containerCenterX + (childCenterX - containerCenterX) * scaleX;
        const newChildCenterY = containerCenterY + (childCenterY - containerCenterY) * scaleY;
        
        child.style.left = `${newChildCenterX - original.width * scaleX / 2}px`;
        child.style.top = `${newChildCenterY - original.height * scaleY / 2}px`;
        child.style.width = `${original.width * scaleX}px`;
        child.style.height = `${original.height * scaleY}px`;
        child.style.fontSize = `${original.fontSize * Math.min(scaleX, scaleY)}px`;
      }
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
