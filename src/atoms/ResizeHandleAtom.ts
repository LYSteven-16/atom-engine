import type { AtomContext } from '../atoms';

export interface ResizeHandleAtomConfig {
  id: string;
  targetAtomIds?: string[];  // 只更新尺寸的原子
  fixedAtomIds?: string[];   // 不做任何修改的原子
  initialWidth?: number;     // 初始宽度
  initialHeight?: number;    // 初始高度
  minWidth?: number;         // 最小宽度
  minHeight?: number;        // 最小高度
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
  private minWidth: number = 50;
  private minHeight: number = 50;

  constructor(context: AtomContext, element: HTMLElement, config: ResizeHandleAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.originalWidth = config.initialWidth || element.offsetWidth || 400;
    this.originalHeight = config.initialHeight || element.offsetHeight || 300;
    this.minWidth = config.minWidth || 50;
    this.minHeight = config.minHeight || 50;
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
    
    // 获取容器圆角
    const containerRadius = parseInt(getComputedStyle(this.element).borderRadius) || 0;
    
    this.handle.style.cssText = `
      position: absolute;
      right: 0;
      bottom: 0;
      width: 20px;
      height: 20px;
      cursor: se-resize;
      z-index: 1000;
      pointer-events: auto;
      overflow: hidden;
      border-radius: ${containerRadius}px 0 0 0;
    `;

    if (containerRadius > 0) {
      // 圆角容器：使用圆角三角形
      const triangle = document.createElement('div');
      triangle.style.cssText = `
        position: absolute;
        right: 0;
        bottom: 0;
        width: 20px;
        height: 20px;
        background: #888;
        border-radius: ${containerRadius}px 0 0 0;
        clip-path: polygon(100% 0, 100% 100%, 0 100%);
      `;
      this.handle.appendChild(triangle);
    } else {
      // 直角容器：使用尖角斜线
      for (let i = 0; i < 5; i++) {
        const line = document.createElement('div');
        const length = 12 - i * 2;
        line.style.cssText = `
          position: absolute;
          right: ${2 + i * 3}px;
          bottom: ${2 + i * 3}px;
          width: ${length}px;
          height: 1px;
          background: #888;
          transform: rotate(-45deg);
          transform-origin: right bottom;
        `;
        this.handle.appendChild(line);
      }
    }

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
      const newWidth = Math.max(this.minWidth, startWidth + dx);
      const newHeight = Math.max(this.minHeight, startHeight + dy);
      
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
      console.log('scaleX:', scaleX, 'scaleY:', scaleY, 'newWidth:', newWidth, 'newHeight:', newHeight, 'originalWidth:', this.originalWidth, 'originalHeight:', this.originalHeight);
      
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
        
        // 等比缩放（相对于左上角）
        child.style.left = `${original.left * scaleX}px`;
        child.style.top = `${original.top * scaleY}px`;
        child.style.width = `${original.width * scaleX}px`;
        child.style.height = `${original.height * scaleY}px`;
        child.style.fontSize = `${original.fontSize * Math.min(scaleX, scaleY)}px`;
        
        console.log('Applied to', atomId, 'left:', child.style.left, 'width:', child.style.width, 'fontSize:', child.style.fontSize);
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
