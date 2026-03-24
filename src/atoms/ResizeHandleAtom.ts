import type { AtomContext } from '../atoms';

/**
 * 调整尺寸手柄原子
 * 功能：在分子容器角落创建调整尺寸的手柄
 * DOM：✅ 有DOM - 创建一个div元素作为调整手柄
 * 
 * 特点：
 * - 在容器指定角落创建可见的调整手柄
 * - 支持四角手柄：nw（左上）、ne（右上）、sw（左下）、se（右下）
 * - 每个手柄有对应的鼠标指针样式
 * - 支持自定义手柄大小和颜色
 * - 通常配合ResizeAtom使用
 * 
 * 手柄位置：
 * - nw（左上角）：向左上方拖动调整尺寸
 * - ne（右上角）：向右上方拖动调整尺寸
 * - sw（左下角）：向左下方拖动调整尺寸
 * - se（右下角）：向右下方拖动调整尺寸（默认）
 * 
 * 鼠标指针样式：
 * - nw-resize：对角线反向箭头
 * - ne-resize：对角线反向箭头
 * - sw-resize：对角线反向箭头
 * - se-resize：对角线反向箭头
 * 
 * 使用场景：
 * - 可调整大小的对话框/面板
 * - 拖拽调整卡片大小
 * - 缩放控制点
 * 
 * @example
 * {
 *   capability: 'resize-handle',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   edge: 'se',
 *   handleSize: 12,
 *   handleColor: [100, 100, 100]
 * }
 */
export interface ResizeHandleAtomConfig {
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

  constructor(context: AtomContext, baker: any, config?: ResizeHandleAtomConfig) {
    this.apply(baker, config);
  }

  private apply(baker: any, config?: ResizeHandleAtomConfig): void {
    try {
      const container = baker.element;
      if (!container) return;

      const handle = document.createElement('div');
      const size = config?.handleSize ?? 10;
      handle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgb(${config?.handleColor?.[0] ?? 200}, ${config?.handleColor?.[1] ?? 200}, ${config?.handleColor?.[2] ?? 200});
        cursor: ${this.getCursor(config?.edge)};
      `;

      switch (config?.edge) {
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
          handle.bottom = '0';
      }

      container.appendChild(handle);
      this.setupResize(handle, baker, config);
      console.log(`[Atom] ${this.context.bakerId} - ResizeHandleAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeHandleAtom应用失败:`, error);
    }
  }

  private setupResize(handle: HTMLElement, baker: any, config?: ResizeHandleAtomConfig): void {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    const minWidth = config?.minWidth ?? 50;
    const minHeight = config?.minHeight ?? 50;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = baker.state.width ?? 100;
      startHeight = baker.state.height ?? 100;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (config?.edge) {
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

      baker.state.width = newWidth;
      baker.state.height = newHeight;
      baker.updateState({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      isResizing = false;
      baker.updateState({ isResizing: false });
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
