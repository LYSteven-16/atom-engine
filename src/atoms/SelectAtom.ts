import type { AtomContext } from '../atoms';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectAtomConfig {
  id: string;
  value?: string;
  options: SelectOption[];
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  onChange?: (value: string) => void;
}

export class SelectAtom {
  readonly capability: 'select' = 'select';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLSelectElement | null = null;
  private config: SelectAtomConfig;

  constructor(context: AtomContext, container: HTMLElement, config: SelectAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const select = document.createElement('select');
      select.setAttribute('data-atom-id', this.id);

      this.config.options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        if (option.value === this.config.value) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      const size = this.config.size ?? 16;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 200;
      const height = this.config.height ?? 32;

      select.style.cssText = `
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
        background: white;
        cursor: pointer;
      `;

      select.addEventListener('change', (e) => {
        this.config.onChange?.((e.target as HTMLSelectElement).value);
      });

      container.appendChild(select);
      this.element = select;
      console.log(`[Atom] ${this.context.bakerId} - SelectAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - SelectAtom渲染失败:`, error);
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
    console.log(`[Atom] ${this.context.bakerId} - SelectAtom已销毁`);
  }
}
