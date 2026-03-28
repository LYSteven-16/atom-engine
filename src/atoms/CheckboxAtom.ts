import type { AtomContext } from '../atoms';

export interface CheckboxAtomConfig {
  id: string;
  checked?: boolean;
  label?: string;
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number };
  onChange?: (checked: boolean) => void;
}

export class CheckboxAtom {
  readonly capability: 'checkbox' = 'checkbox';
  readonly context: AtomContext;
  readonly id: string;
  private container: HTMLLabelElement | null = null;
  private checkbox: HTMLInputElement | null = null;
  private config: CheckboxAtomConfig;

  constructor(context: AtomContext, element: HTMLElement, config: CheckboxAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(element);
  }

  private render(container: HTMLElement): void {
    try {
      const label = document.createElement('label');
      label.setAttribute('data-atom-id', this.id);
      label.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.config.checked ?? false;
      checkbox.style.cssText = `
        width: 16px;
        height: 16px;
        margin-right: 8px;
        cursor: pointer;
      `;

      checkbox.addEventListener('change', (e) => {
        this.config.onChange?.((e.target as HTMLInputElement).checked);
      });

      label.appendChild(checkbox);

      if (this.config.label) {
        const span = document.createElement('span');
        span.textContent = this.config.label;
        const size = this.config.size ?? 14;
        const color = this.config.color ?? [51, 51, 51];
        span.style.cssText = `
          font-size: ${size}px;
          color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        `;
        label.appendChild(span);
      }

      container.appendChild(label);
      this.container = label;
      this.checkbox = checkbox;
      console.log(`[Atom] ${this.context.bakerId} - CheckboxAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CheckboxAtom渲染失败:`, error);
    }
  }

  public isChecked(): boolean {
    return this.checkbox?.checked ?? false;
  }

  public setChecked(checked: boolean): void {
    if (this.checkbox) {
      this.checkbox.checked = checked;
    }
  }

  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.checkbox = null;
    console.log(`[Atom] ${this.context.bakerId} - CheckboxAtom已销毁`);
  }
}
