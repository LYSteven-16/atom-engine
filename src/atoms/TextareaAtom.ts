import type { AtomContext } from '../atoms';

export interface TextareaAtomConfig {
  id: string;
  value?: string;
  placeholder?: string;
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  rows?: number;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
}

export class TextareaAtom {
  readonly capability: 'textarea' = 'textarea';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLTextAreaElement | null = null;
  private config: TextareaAtomConfig;

  constructor(context: AtomContext, container: HTMLElement, config: TextareaAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const textarea = document.createElement('textarea');
      textarea.setAttribute('data-atom-id', this.id);
      
      if (this.config.value) {
        textarea.value = this.config.value;
      }
      
      if (this.config.placeholder) {
        textarea.placeholder = this.config.placeholder;
      }

      if (this.config.rows) {
        textarea.rows = this.config.rows;
      }

      const size = this.config.size ?? 14;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 300;
      const height = this.config.height ?? 100;

      textarea.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
        resize: vertical;
        font-family: inherit;
      `;

      textarea.addEventListener('change', (e) => {
        this.config.onChange?.((e.target as HTMLTextAreaElement).value);
      });

      textarea.addEventListener('input', (e) => {
        this.config.onInput?.((e.target as HTMLTextAreaElement).value);
      });

      container.appendChild(textarea);
      this.element = textarea;
      console.log(`[Atom] ${this.context.bakerId} - TextareaAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - TextareaAtom渲染失败:`, error);
    }
  }

  public getValue(): string {
    return this.element?.value ?? '';
  }

  public setValue(value: string): void {
    if (this.element) {
      this.element.value = value;
    }
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - TextareaAtom已销毁`);
  }
}
