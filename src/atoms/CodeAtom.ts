import type { AtomContext } from '../atoms';

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
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = config.code;
      if (config.language) code.className = `language-${config.language}`;
      pre.appendChild(code);
      pre.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        overflow: auto;
      `;
      code.style.cssText = `
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
      `;
      container.appendChild(pre);

      if (!(window as any).hljs) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
        script.onload = () => (window as any).hljs?.highlightElement(code);
        document.head.appendChild(script);
      } else {
        (window as any).hljs.highlightElement(code);
      }

      console.log(`[Atom] ${this.context.bakerId} - CodeAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CodeAtom渲染失败:`, error);
    }
  }
}
