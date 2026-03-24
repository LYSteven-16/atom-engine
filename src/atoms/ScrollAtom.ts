import type { AtomContext } from '../atoms';

/**
 * 滚动原子
 * 功能：为分子容器添加滚动能力
 * DOM：❌ 无DOM - 不创建任何DOM元素，仅绑定滚动事件
 * 
 * 特点：
 * - 不渲染DOM元素，纯事件处理
 * - 通过鼠标滚轮控制滚动
 * - 支持水平、垂直或双向滚动
 * - 支持滚动范围限制
 * - 使用transform实现滚动效果（性能更好）
 * 
 * 滚动方向：
 * - horizontal：仅水平滚动
 * - vertical：仅垂直滚动（默认）
 * - both：水平和垂直都支持
 * 
 * 状态管理：
 * - scrollX：水平滚动位置
 * - scrollY：垂直滚动位置
 * 
 * 使用场景：
 * - 滚动画布/地图
 * - 无限滚动列表
 * - 滚轮缩放
 * - 拖拽后滚轮微调
 * 
 * 注意：
 * - 此原子使用transform实现滚动，不是原生overflow
 * - 需要内容超出容器才能看到滚动效果
 * 
 * @example
 * {
 *   capability: 'scroll',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   direction: 'vertical',
 *   maxScrollY: 1000
 * }
 */
export interface ScrollAtomConfig {
  direction?: 'horizontal' | 'vertical' | 'both';
  scrollX?: number;
  scrollY?: number;
  maxScrollX?: number;
  maxScrollY?: number;
  onScroll?: (pos: { scrollX: number; scrollY: number }) => void;
}

export class ScrollAtom {
  readonly capability: 'scroll' = 'scroll';
  readonly context: AtomContext;

  constructor(context: AtomContext, baker: any, config?: ScrollAtomConfig) {
    this.apply(baker, config);
  }

  private apply(baker: any, config?: ScrollAtomConfig): void {
    try {
      const container = baker.element;
      if (!container) return;

      container.style.overflow = 'hidden';

      let scrollX = config?.scrollX ?? 0;
      let scrollY = config?.scrollY ?? 0;
      const maxScrollX = config?.maxScrollX ?? Infinity;
      const maxScrollY = config?.maxScrollY ?? Infinity;

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();

        if (config?.direction === 'horizontal' || config?.direction === 'both') {
          scrollX = Math.max(0, Math.min(maxScrollX, scrollX + e.deltaX + e.deltaY));
          baker.updateState({ scrollX });
        }

        if (config?.direction === 'vertical' || config?.direction === 'both') {
          scrollY = Math.max(0, Math.min(maxScrollY, scrollY + e.deltaY));
          baker.updateState({ scrollY });
        }

        config?.onScroll?.({ scrollX, scrollY });
      };

      container.addEventListener('wheel', onWheel, { passive: false });
      console.log(`[Atom] ${this.context.bakerId} - ScrollAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ScrollAtom应用失败:`, error);
    }
  }
}
