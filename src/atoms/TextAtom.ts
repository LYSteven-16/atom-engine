import type { AtomContext } from '../atoms';

export interface TextAtomConfig {
  id: string;
  text: string;
  size: number;
  color: [number, number, number];
  position?: { x: number; y: number; z?: number };
  writingMode?: 'horizontal' | 'vertical';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  overflow?: 'visible' | 'hidden' | 'ellipsis';
  maxWidth?: number;
  lineHeight?: number;
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
  writingMode: 'horizontal' | 'vertical';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  overflow: 'visible' | 'hidden' | 'ellipsis';
  maxWidth?: number;
  lineHeight?: number;

  constructor(context: AtomContext, container: HTMLElement, config: TextAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.text = config.text;
    this.size = config.size;
    this.color = config.color;
    this.position = config.position;
    this.writingMode = config.writingMode ?? 'horizontal';
    this.fontWeight = config.fontWeight ?? 'normal';
    this.fontStyle = config.fontStyle ?? 'normal';
    this.textAlign = config.textAlign ?? 'left';
    this.overflow = config.overflow ?? 'visible';
    this.maxWidth = config.maxWidth;
    this.lineHeight = config.lineHeight;
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const element = document.createElement('div');
      element.setAttribute('data-atom-id', this.id);
      
      const writingModeCSS = this.writingMode === 'vertical' ? 'writing-mode: vertical-rl;' : '';
      const overflowCSS = this.overflow === 'ellipsis' ? 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' : 
                         this.overflow === 'hidden' ? 'overflow: hidden;' : '';
      const maxWidthCSS = this.maxWidth ? `max-width: ${this.maxWidth}px;` : '';
      const lineHeightCSS = this.lineHeight ? `line-height: ${this.lineHeight};` : '';
      
      element.style.cssText = `
        position: absolute;
        left: ${this.position?.x ?? 0}px;
        top: ${this.position?.y ?? 0}px;
        font-size: ${this.size}px;
        color: rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});
        font-weight: ${this.fontWeight};
        font-style: ${this.fontStyle};
        text-align: ${this.textAlign};
        pointer-events: none;
        user-select: none;
        ${writingModeCSS}
        ${overflowCSS}
        ${maxWidthCSS}
        ${lineHeightCSS}
      `;
      element.textContent = this.text;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - TextAtom渲染成功: "${this.text.substring(0, 20)}..."`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - TextAtom渲染失败:`, error);
    }
  }
}
