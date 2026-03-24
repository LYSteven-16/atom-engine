import type { AtomContext } from '../atoms';

/**
 * 点击原子
 * 功能：为分子容器绑定点击相关事件
 * DOM：❌ 无DOM - 不创建任何DOM元素，仅绑定事件
 * 
 * 特点：
 * - 不渲染DOM元素，纯事件处理
 * - 支持单击、双击、鼠标按下、鼠标释放事件
 * - 事件绑定到Baker的容器元素上
 * - 通常配合动画原子使用（点击触发动画）
 * 
 * 使用场景：
 * - 点击切换展开/折叠状态
 * - 点击打开弹窗
 * - 点击切换激活状态
 * 
 * @example
 * {
 *   capability: 'click',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   onClick: () => { console.log('clicked'); }
 * }
 */
export interface ClickAtomConfig {
  onClick?: (e: MouseEvent) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
}

export class ClickAtom {
  readonly capability: 'click' = 'click';
  readonly context: AtomContext;

  constructor(context: AtomContext, baker: any, config?: ClickAtomConfig) {
    this.apply(baker, config);
  }

  private apply(baker: any, config?: ClickAtomConfig): void {
    try {
      const container = baker.element;
      if (!container) return;

      if (config?.onClick) {
        container.addEventListener('click', config.onClick);
      }
      if (config?.onDoubleClick) {
        container.addEventListener('dblclick', config.onDoubleClick);
      }
      if (config?.onMouseDown) {
        container.addEventListener('mousedown', config.onMouseDown);
      }
      if (config?.onMouseUp) {
        container.addEventListener('mouseup', config.onMouseUp);
      }
      console.log(`[Atom] ${this.context.bakerId} - ClickAtom应用成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ClickAtom应用失败:`, error);
    }
  }
}
