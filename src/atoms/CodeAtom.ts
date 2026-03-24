import type { AtomContext } from '../atoms';

export interface CodeAtomConfig {
  code: string;
  language?: string;
  position?: { x: number; y: number; z?: number };
}

const KEYWORDS = [
  'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'return',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'try', 'catch', 'finally', 'throw', 'new', 'this', 'import', 'export',
  'default', 'from', 'as', 'async', 'await', 'static', 'public', 'private',
  'protected', 'extends', 'implements', 'true', 'false', 'null', 'undefined'
];

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  javascript: KEYWORDS,
  typescript: [...KEYWORDS, 'interface', 'type', 'enum', 'namespace', 'declare', 'abstract'],
  python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'import', 'from', 'return', 'yield', 'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'self', 'async', 'await'],
  java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'return', 'null', 'true', 'false', 'import', 'package'],
  go: ['func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'package', 'import', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'return', 'go', 'defer', 'select', 'fallthrough', 'nil', 'true', 'false', 'make', 'new', 'len', 'cap', 'append', 'copy'],
  rust: ['fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait', 'type', 'where', 'pub', 'priv', 'mod', 'use', 'crate', 'super', 'self', 'Self', 'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'return', 'as', 'in', 'ref', 'move', 'async', 'await', 'dyn', 'unsafe', 'extern', 'true', 'false', 'Some', 'None', 'Ok', 'Err'],
};

export class CodeAtom {
  readonly capability: 'code' = 'code';
  readonly context: AtomContext;

  constructor(context: AtomContext, container: HTMLElement, config: CodeAtomConfig) {
    this.render(container, config);
  }

  private highlight(code: string, language?: string): string {
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const keywords = language && LANGUAGE_KEYWORDS[language] ? LANGUAGE_KEYWORDS[language] : LANGUAGE_KEYWORDS['javascript'];

    for (const kw of keywords) {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      escaped = escaped.replace(regex, '<span style="color:#d73a49;font-weight:500">$1</span>');
    }

    escaped = escaped.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span style="color:#32a852">$1</span>');
    escaped = escaped.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span style="color:#6a737d;font-style:italic">$1</span>');
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#005cc5">$1</span>');

    return escaped;
  }

  private render(container: HTMLElement, config: CodeAtomConfig): void {
    try {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.innerHTML = this.highlight(config.code, config.language);
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
      console.log(`[Atom] ${this.context.bakerId} - CodeAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CodeAtom渲染失败:`, error);
    }
  }
}
