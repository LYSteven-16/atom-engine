import type { AtomContext } from '../atoms';

/**
 * 图片原子
 * 功能：在分子容器内渲染图片
 * DOM：✅ 有DOM - 创建一个img元素
 * 
 * 特点：
 * - 绝对定位在容器内指定位置
 * - 支持设置宽高
 * - 支持alt文本用于无障碍访问
 * - 图片加载失败时会显示alt文本
 * 
 * @example
 * {
 *   capability: 'image',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   src: 'https://example.com/image.png',
 *   width: 200,
 *   height: 150,
 *   alt: '示例图片'
 * }
 */
export interface ImageAtomConfig {
  src: string;
  width: number;
  height: number;
  alt?: string;
  position?: { x: number; y: number; z?: number };
}

export class ImageAtom {
  readonly capability: 'image' = 'image';
  readonly context: AtomContext;

  constructor(context: AtomContext, container: HTMLElement, config: ImageAtomConfig) {
    this.render(container, config);
  }

  private render(container: HTMLElement, config: ImageAtomConfig): void {
    try {
      const element = document.createElement('img');
      element.src = config.src;
      element.width = config.width;
      element.height = config.height;
      if (config.alt) element.alt = config.alt;
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - ImageAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ImageAtom渲染失败:`, error);
    }
  }
}
