import type { AtomContext } from '../atoms';

/**
 * 代码原子
 * 功能：在分子容器内渲染代码块
 * DOM：✅ 有DOM - 创建一个pre元素包含code子元素
 * 
 * 特点：
 * - 绝对定位在容器内指定位置
 * - 使用pre标签保持代码格式（空格、换行）
 * - 可选的语言className，方便后续语法高亮库（如Prism.js）处理
 * - 带默认样式（浅灰背景、内边距、圆角）
 * - 内容溢出时显示滚动条
 * 
 * 注意：
 * - 此原子仅渲染纯代码文本，不包含语法高亮
 * - 如需语法高亮，可在外部引入highlight.js或prism.js
 * 
 * @example
 * {
 *   capability: 'code',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   code: 'const hello = "world";',
 *   language: 'javascript'
 * }
 */
export interface CodeAtomConfig {
  code: string;
  language?: string;
  position?: { x: number; y: number; z?: number };
}

export class CodeAtom {
  readonly capability: 'code' = 'code';
  readonly context: AtomContext;

  constructor(context: AtomContext, container: HTMLElement, config: CodeAtomConfig) {
    this.render(container, config);
  }

  private render(container: HTMLElement, config: CodeAtomConfig): void {
    try {
      const element = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = config.code;
      if (config.language) code.className = `language-${config.language}`;
      element.appendChild(code);
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        overflow: auto;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - CodeAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CodeAtom渲染失败:`, error);
    }
  }
}
