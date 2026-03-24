import type { AtomContext } from '../atoms';

/**
 * 图标原子
 * 功能：在分子容器内渲染图标
 * DOM：✅ 有DOM - 创建一个div元素作为图标容器
 * 
 * 特点：
 * - 绝对定位在容器内指定位置
 * - 支持任意文本作为图标（emoji、字体图标符号等）
 * - 宽高等于size，默认24px
 * - 使用flexbox居中显示图标内容
 * 
 * 使用场景：
 * - 表情符号图标（emoji）
 * - 字体图标（Font Awesome、Material Icons等）
 * - 自定义图标符号
 * 
 * @example
 * {
 *   capability: 'icon',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   icon: '🎯',
 *   size: 32
 * }
 */
export interface IconAtomConfig {
  icon: string;
  size?: number;
  position?: { x: number; y: number; z?: number };
}

export class IconAtom {
  readonly capability: 'icon' = 'icon';
  readonly context: AtomContext;

  constructor(context: AtomContext, container: HTMLElement, config: IconAtomConfig) {
    this.render(container, config);
  }

  private render(container: HTMLElement, config: IconAtomConfig): void {
    try {
      const element = document.createElement('div');
      element.textContent = config.icon;
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        font-size: ${config.size ?? 24}px;
        width: ${config.size ?? 24}px;
        height: ${config.size ?? 24}px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - IconAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - IconAtom渲染失败:`, error);
    }
  }
}
