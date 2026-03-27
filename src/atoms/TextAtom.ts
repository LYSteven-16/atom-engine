import type { AtomContext } from '../atoms';

/**
 * 文本原子
 * 功能：在分子容器内渲染纯文本内容
 * DOM：✅ 有DOM - 创建一个div元素作为文本容器
 * 
 * 特点：
 * - 绝对定位在容器内指定位置
 * - 文字大小、颜色可配置
 * - 禁止用户选中和鼠标事件穿透
 * 
 * @example
 * {
 *   capability: 'text',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   text: 'Hello World',
 *   size: 16,
 *   color: [0, 0, 0]
 * }
 */
export interface TextAtomConfig {
  id: string;
  text: string;
  size: number;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
}

export interface RenderResult {
  success: boolean;
  element?: HTMLElement;
  error?: string;
}

export class TextAtom {
  readonly capability: 'text' = 'text';
  readonly context: AtomContext;
  readonly id: string;
  text: string;
  size: number;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };

  constructor(context: AtomContext, container: HTMLElement, config: TextAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.text = config.text;
    this.size = config.size;
    this.color = config.color;
    this.position = config.position;
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const element = document.createElement('div');
      element.style.cssText = `
        position: absolute;
        left: ${this.position?.x ?? 0}px;
        top: ${this.position?.y ?? 0}px;
        font-size: ${this.size}px;
        color: rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
      `;
      element.textContent = this.text;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - TextAtom渲染成功: "${this.text.substring(0, 20)}..."`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - TextAtom渲染失败:`, error);
    }
  }
}
