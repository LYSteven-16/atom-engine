import type { AtomContext } from '../atoms';

export interface CodeAtomConfig {
  code: string;
  language?: string;
  position?: { x: number; y: number; z?: number };
  backgroundColor?: [number, number, number];
  autoFormat?: boolean;
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

  private format(code: string, language?: string): string {
    const lang = language ?? 'javascript';
    if (lang === 'python') {
      return this.formatPython(code);
    }
    return this.formatCStyle(code);
  }

  private formatPython(code: string): string {
    const lines = code.split('\n');
    const result: string[] = [];
    let indent = 0;
    const indentStr = '    ';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('#') || line.startsWith('"""') || line.startsWith("'''")) {
        result.push(rawLine);
        continue;
      }

      const trimmed = line.replace(/:$/, '');
      if (trimmed) {
        const dedent = line.match(/^(elif|else|except)\b/);
        if (dedent) indent = Math.max(0, indent - 1);
        result.push(indentStr.repeat(indent) + trimmed + ':');
        if (dedent) indent++;
        if (['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'def', 'class', 'with', 'async'].some(k => line.startsWith(k))) {
          indent++;
        }
      } else {
        result.push('');
      }
    }

    return result.join('\n');
  }

  private formatCStyle(code: string): string {
    const tokens: string[] = [];
    let i = 0;
    const src = code;

    while (i < src.length) {
      const ch = src[i];
      if (ch === '"' || ch === "'") {
        let str = ch;
        i++;
        while (i < src.length && src[i] !== ch) {
          if (src[i] === '\\' && i + 1 < src.length) { str += src[i] + src[i + 1]; i += 2; }
          else { str += src[i]; i++; }
        }
        if (i < src.length) { str += src[i]; i++; }
        tokens.push(str);
      } else if (ch === '/' && src[i + 1] === '/') {
        let cmt = '';
        while (i < src.length && src[i] !== '\n') { cmt += src[i]; i++; }
        tokens.push(cmt);
      } else if (ch === '/' && src[i + 1] === '*') {
        let cmt = '';
        while (i < src.length - 1 && !(src[i] === '*' && src[i + 1] === '/')) { cmt += src[i]; i++; }
        if (i < src.length - 1) { cmt += '*/'; i += 2; }
        tokens.push(cmt);
      } else if (' \t\n\r'.includes(ch)) {
        let ws = '';
        while (i < src.length && ' \t\n\r'.includes(src[i])) { ws += src[i]; i++; }
        tokens.push(ws);
      } else if ('{};,+-*/%=<>!&|?:'.includes(ch)) {
        tokens.push(ch);
        i++;
      } else {
        let word = '';
        while (i < src.length && !' \t\n\r{};,+-*/%=<>!&|?:'.includes(src[i])) { word += src[i]; i++; }
        tokens.push(word);
      }
    }

    const lines: string[] = [];
    let line = '';
    let indent = 0;
    let prevTok = '';
    const indentStr = '  ';

    for (const tok of tokens) {
      if (tok === '\n') {
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line);
        lines.push('');
        line = '';
        prevTok = '\n';
      } else if (tok.trim() === '') {
        if (prevTok !== ' ' && prevTok !== '\n') line += ' ';
        prevTok = tok;
      } else if (tok === '{') {
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line);
        lines.push(indentStr.repeat(indent) + '{');
        indent++;
        line = '';
        prevTok = '{';
      } else if (tok === '}') {
        indent = Math.max(0, indent - 1);
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line);
        lines.push(indentStr.repeat(indent) + '}');
        line = '';
        prevTok = '}';
      } else if (tok === ';') {
        line = line.trimEnd();
        if (line) lines.push(indentStr.repeat(indent) + line + ';');
        line = '';
        prevTok = ';';
      } else if (tok === ',') {
        line = line.trimEnd();
        lines.push(indentStr.repeat(indent) + line + ',');
        line = '';
        prevTok = ',';
      } else {
        line += tok;
        prevTok = tok;
      }
    }

    line = line.trimEnd();
    if (line) lines.push(indentStr.repeat(indent) + line);

    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  private detectLanguage(code: string): string | undefined {
    const src = code.trim();
    if (/^(def |import |from |class |if __name__ |print\(|elif |except |yield |lambda |async def )/.test(src)) return 'python';
    if (/^(fn |let mut |impl |pub fn |struct |enum |use std|mod \w+;|-> |#\[)/.test(src)) return 'rust';
    if (/^(func |package |import \"|type \w+ struct|func \(|go |defer )/.test(src)) return 'go';
    if (/^(public class|private |protected |void |System\.out|import java|\.jar|@Override)/.test(src)) return 'java';
    if (/^(import |export |const |let |var |function |class |interface |=>|async )/.test(src)) return 'javascript';
    if (/:\s*(string|number|boolean|interface|type)\b/.test(src) || /interface\s+\w+\s*{/.test(src)) return 'typescript';
    return 'javascript';
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
      const formatted = config.autoFormat !== false ? this.format(config.code, config.language) : config.code;
      const bg = config.backgroundColor ?? [30, 30, 30];
      const bgColor = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      const textColor = (bg[0] * 0.299 + bg[1] * 0.587 + bg[2] * 0.114) > 150 ? '#1e1e1e' : '#d4d4d4';
      const badgeBg = `rgb(${Math.min(255, bg[0] + 20)},${Math.min(255, bg[1] + 20)},${Math.min(255, bg[2] + 20)})`;

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.innerHTML = this.highlight(formatted, config.language);
      pre.appendChild(code);
      pre.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        background: ${bgColor};
        padding: 10px;
        padding-top: 32px;
        border-radius: 16px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
      `;
      code.style.cssText = `
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        color: ${textColor};
      `;

      const lang = config.language ?? this.detectLanguage(config.code);
      if (lang) {
        const badge = document.createElement('div');
        badge.textContent = lang;
        badge.style.cssText = `
          position: absolute;
          top: 6px;
          right: 10px;
          background: ${badgeBg};
          color: ${textColor};
          padding: 2px 8px;
          border-radius: 16px;
          font-size: 11px;
          font-family: 'Consolas', monospace;
          opacity: 0.8;
        `;
        pre.appendChild(badge);
      }

      container.appendChild(pre);
      console.log(`[Atom] ${this.context.bakerId} - CodeAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CodeAtom渲染失败:`, error);
    }
  }
}
