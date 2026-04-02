import type { AtomContext } from '../atoms';

export interface EditableTextAtomConfig {
  id: string;
  text: string;
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number };
  editable?: boolean;
  onChange?: (newText: string) => void;
  onDoubleClick?: () => void;
}

export class EditableTextAtom {
  readonly capability: 'editable-text' = 'editable-text';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement | null = null;
  private config: EditableTextAtomConfig;
  private isEditing: boolean = false;

  constructor(context: AtomContext, container: HTMLElement, config: EditableTextAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = {
      editable: true,
      ...config
    };
    this.render(container);
  }

  private render(container: HTMLElement): void {
    try {
      const div = document.createElement('div');
      div.setAttribute('data-atom-id', this.id);
      div.textContent = this.config.text;

      const size = this.config.size ?? 16;
      const color = this.config.color ?? [51, 51, 51];

      div.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        font-size: ${size}px;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
        padding: 4px 8px;
        border: 1px solid transparent;
        border-radius: 4px;
        cursor: text;
        user-select: text;
        min-width: 50px;
        white-space: pre-wrap;
      `;

      if (this.config.editable) {
        div.addEventListener('dblclick', () => {
          this.startEditing();
          this.config.onDoubleClick?.();
        });

        div.addEventListener('blur', () => {
          this.stopEditing();
        });

        div.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.stopEditing();
          }
          if (e.key === 'Escape') {
            this.stopEditing();
          }
        });
      }

      container.appendChild(div);
      this.element = div;
      console.log(`[Atom] ${this.context.bakerId} - EditableTextAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - EditableTextAtom渲染失败:`, error);
    }
  }

  private startEditing(): void {
    if (!this.element || this.isEditing) return;
    this.isEditing = true;
    this.element.contentEditable = 'true';
    this.element.style.border = '1px solid #007bff';
    this.element.style.outline = 'none';
    this.element.focus();
  }

  private stopEditing(): void {
    if (!this.element || !this.isEditing) return;
    this.isEditing = false;
    this.element.contentEditable = 'false';
    this.element.style.border = '1px solid transparent';
    
    const newText = this.element.textContent ?? '';
    if (newText !== this.config.text) {
      this.config.text = newText;
      this.config.onChange?.(newText);
    }
  }

  public getText(): string {
    return this.element?.textContent ?? '';
  }

  public setText(text: string): void {
    if (this.element) {
      this.element.textContent = text;
      this.config.text = text;
    }
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    console.log(`[Atom] ${this.context.bakerId} - EditableTextAtom已销毁`);
  }
}
