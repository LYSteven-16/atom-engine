import type { AtomContext } from '../atoms';

export interface InputAtomConfig {
  id: string;
  value?: string;
  placeholder?: string;
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
}

export class InputAtom {
  readonly capability: 'input' = 'input';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLInputElement | null = null;
  private config: InputAtomConfig;

  constructor(context: AtomContext, container: HTMLElement, config: InputAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('data-atom-id', this.id);
      
      if (this.config.value) {
        input.value = this.config.value;
      }
      
      if (this.config.placeholder) {
        input.placeholder = this.config.placeholder;
      }

      const size = this.config.size ?? 16;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 200;
      const height = this.config.height ?? 32;

      input.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        width: ${width}px;
        height: ${height}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
      `;

      input.addEventListener('change', (e) => {
        this.config.onChange?.((e.target as HTMLInputElement).value);
      });

      input.addEventListener('input', (e) => {
        this.config.onInput?.((e.target as HTMLInputElement).value);
      });

      container.appendChild(input);
      this.element = input;
      console.log(`[Atom] ${this.context.bakerId} - InputAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - InputAtom渲染失败:`, error);
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
    console.log(`[Atom] ${this.context.bakerId} - InputAtom已销毁`);
  }
}
