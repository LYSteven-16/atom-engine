import type { AtomContext } from '../atoms';

/**
 * 调整尺寸原子
 * 功能：让分子容器可以被调整大小
 * DOM：❌ 无DOM - 不创建任何DOM元素，仅绑定调整大小事件
 * 
 * 特点：
 * - 不渲染DOM元素，纯事件处理
 * - 支持鼠标拖拽调整元素宽高
 * - 支持最小/最大宽高限制
 * - 拖拽过程中实时更新Baker状态
 * - 需要配合ResizeHandleAtom使用（通常在角落/边缘添加调整手柄）
 * 
 * 调整流程：
 * 1. mousedown：记录起始尺寸，开始调整
 * 2. mousemove：计算偏移量，更新元素宽高
 * 3. mouseup：结束调整
 * 
 * 状态管理：
 * - isResizing：是否正在调整
 * - width：元素宽度
 * - height：元素高度
 * 
 * 注意：
 * - 此原子默认在整个容器上触发调整
 * - 通常配合ResizeHandleAtom在特定位置添加调整手柄
 * 
 * 使用场景：
 * - 可调整大小的面板
 * - 自由拖拽调整组件尺寸
 * 
 * @example
 * {
 *   capability: 'resize',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   minWidth: 100,
 *   minHeight: 50,
 *   maxWidth: 800,
 *   maxHeight: 600
 * }
 */
export interface ResizeAtomConfig {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResizeStart?: (size: { width: number; height: number }) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onResizeEnd?: (size: { width: number; height: number }) => void;
}

export class ResizeAtom {
  readonly capability: 'resize' = 'resize';
  readonly context: AtomContext;

  constructor(context: AtomContext, baker: any, config?: ResizeAtomConfig) {
    this.apply(baker, config);
  }

  private apply(baker: any, config?: ResizeAtomConfig): void {
    try {
      const container = baker.element;
      if (!container) return;

      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      const minWidth = config?.minWidth ?? 20;
      const minHeight = config?.minHeight ?? 20;
      const maxWidth = config?.maxWidth ?? Infinity;
      const maxHeight = config?.maxHeight ?? Infinity;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = baker.state.width ?? 100;
        startHeight = baker.state.height ?? 100;
        baker.updateState({ isResizing: true });
        config?.onResizeStart?.({ width: startWidth, height: startHeight });
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));

        baker.state.width = newWidth;
        baker.state.height = newHeight;
        baker.updateState({ width: newWidth, height: newHeight });
        config?.onResize?.({ width: newWidth, height: newHeight });
      };

      const onMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        baker.updateState({ isResizing: false });
        config?.onResizeEnd?.({ width: baker.state.width ?? 0, height: baker.state.height ?? 0 });
      };

      container.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      console.log(`[Atom] ${this.context.bakerId} - ResizeAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ResizeAtom应用失败:`, error);
    }
  }
}
