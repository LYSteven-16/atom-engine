import type { AtomContext } from '../atoms';

/**
 * 悬停原子
 * 功能：为分子容器绑定悬停相关事件
 * DOM：❌ 无DOM - 不创建任何DOM元素，仅绑定事件
 * 
 * 特点：
 * - 不渲染DOM元素，纯事件处理
 * - 支持鼠标进入、离开事件
 * - 支持mouseover/mouseout（会冒泡）和mouseenter/mouseleave（不冒泡）
 * - 事件绑定到Baker的容器元素上
 * - 通常配合动画原子使用（悬停触发动画）
 * 
 * mouseover vs mouseenter：
 * - mouseover：进入元素或其子元素时触发，会冒泡
 * - mouseenter：仅进入元素时触发，不冒泡
 * 
 * 使用场景：
 * - 悬停显示提示信息
 * - 悬停改变样式
 * - 悬停触发动画效果
 * 
 * @example
 * {
 *   capability: 'hover',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   onMouseEnter: () => { console.log('hover start'); },
 *   onMouseLeave: () => { console.log('hover end'); }
 * }
 */
export interface HoverAtomConfig {
  onHoverStart?: (e: MouseEvent) => void;
  onHoverEnd?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
}

export class HoverAtom {
  readonly capability: 'hover' = 'hover';
  readonly context: AtomContext;

  constructor(context: AtomContext, baker: any, config?: HoverAtomConfig) {
    this.apply(baker, config);
  }

  private apply(baker: any, config?: HoverAtomConfig): void {
    try {
      const container = baker.element;
      if (!container) return;

      if (config?.onMouseEnter) {
        container.addEventListener('mouseenter', config.onMouseEnter);
      }
      if (config?.onMouseLeave) {
        container.addEventListener('mouseleave', config.onMouseLeave);
      }
      if (config?.onHoverStart) {
        container.addEventListener('mouseover', config.onHoverStart);
      }
      if (config?.onHoverEnd) {
        container.addEventListener('mouseout', config.onHoverEnd);
      }
      console.log(`[Atom] ${this.context.bakerId} - HoverAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - HoverAtom应用失败:`, error);
    }
  }
}
