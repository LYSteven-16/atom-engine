import type { AtomContext } from '../atoms';

/**
 * 拖拽原子
 * 功能：让分子容器可以被拖拽移动
 * DOM：❌ 无DOM - 不创建任何DOM元素，仅绑定拖拽事件
 * 
 * 特点：
 * - 不渲染DOM元素，纯事件处理
 * - 支持鼠标拖拽移动元素位置
 * - 支持自定义拖拽手柄（默认整个容器可拖拽）
 * - 支持边界限制（限制拖拽范围）
 * - 拖拽过程中实时更新Baker状态
 * 
 * 拖拽流程：
 * 1. mousedown：记录起始位置，开始拖拽
 * 2. mousemove：计算偏移量，更新元素位置
 * 3. mouseup：结束拖拽
 * 
 * 状态管理：
 * - isDragging：是否正在拖拽
 * - x：元素x坐标
 * - y：元素y坐标
 * 
 * 使用场景：
 * - 自由拖拽移动的卡片
 * - 可调整位置的组件
 * - 拖拽排序
 * 
 * @example
 * {
 *   capability: 'drag',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   bounds: { x: 0, y: 0, width: 800, height: 600 },
 *   onDragStart: (pos) => console.log('start', pos),
 *   onDragEnd: (pos) => console.log('end', pos)
 * }
 */
export interface DragAtomConfig {
  handle?: HTMLElement;
  bounds?: { x: number; y: number; width: number; height: number };
  onDragStart?: (pos: { x: number; y: number }) => void;
  onDragMove?: (pos: { x: number; y: number }) => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
}

export class DragAtom {
  readonly capability: 'drag' = 'drag';
  readonly context: AtomContext;

  constructor(context: AtomContext, baker: any, config?: DragAtomConfig) {
    this.apply(baker, config);
  }

  private apply(baker: any, config?: DragAtomConfig): void {
    try {
      const container = baker.element;
      if (!container) return;

      const handle = config?.handle ?? container;
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialX = 0;
      let initialY = 0;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = baker.state.x ?? 0;
        initialY = baker.state.y ?? 0;
        baker.updateState({ isDragging: true });
        config?.onDragStart?.({ x: initialX, y: initialY });
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newX = initialX + dx;
        let newY = initialY + dy;

        if (config?.bounds) {
          newX = Math.max(config.bounds.x, Math.min(newX, config.bounds.x + config.bounds.width - (baker.state.width ?? 0)));
          newY = Math.max(config.bounds.y, Math.min(newY, config.bounds.y + config.bounds.height - (baker.state.height ?? 0)));
        }

        baker.state.x = newX;
        baker.state.y = newY;
        baker.updateState({ x: newX, y: newY });
        config?.onDragMove?.({ x: newX, y: newY });
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        baker.updateState({ isDragging: false });
        config?.onDragEnd?.({ x: baker.state.x ?? 0, y: baker.state.y ?? 0 });
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
