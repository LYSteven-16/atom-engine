import type { AtomContext } from '../atoms';

export interface ChoiceOption {
  label: string;
  value: string;
  isCorrect?: boolean;
}

export interface ChoiceAtomConfig {
  id: string;
  placeholder?: string;
  optionCount?: number;
  options: ChoiceOption[];
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  onSelect?: (value: string, isCorrect: boolean) => void;
  onCorrect?: () => void;
  onIncorrect?: () => void;
}

export class ChoiceAtom {
  readonly capability: 'choice' = 'choice';
  readonly context: AtomContext;
  readonly id: string;
  private container: HTMLDivElement | null = null;
  private config: ChoiceAtomConfig;

  constructor(context: AtomContext, element: HTMLElement, config: ChoiceAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.config = config;
    this.render(element);
  }

  private render(container: HTMLElement): void {
    try {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-atom-id', this.id);

      const size = this.config.size ?? 14;
      const color = this.config.color ?? [51, 51, 51];
      const width = this.config.width ?? 110;
      const height = this.config.height ?? 36;

      wrapper.style.cssText = `
        position: absolute;
        left: ${this.config.position?.x ?? 0}px;
        top: ${this.config.position?.y ?? 0}px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      `;

      const optionCount = this.config.optionCount ?? 4;
      const optionsToRender = this.config.options.slice(0, optionCount);

      optionsToRender.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.setAttribute('data-option-index', index.toString());
        optionElement.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${width}px;
          height: ${height}px;
          font-size: ${size}px;
          color: rgb(${color[0]}, ${color[1]}, ${color[2]});
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          user-select: none;
          background: white;
          transition: all 0.2s ease;
        `;

        optionElement.textContent = option.label;

        optionElement.addEventListener('click', () => {
          this.handleOptionClick(option, optionElement);
        });

        optionElement.addEventListener('mouseenter', () => {
          if (!optionElement.classList.contains('correct') && !optionElement.classList.contains('incorrect')) {
            optionElement.style.borderColor = '#999';
            optionElement.style.backgroundColor = '#f5f5f5';
          }
        });

        optionElement.addEventListener('mouseleave', () => {
          if (!optionElement.classList.contains('correct') && !optionElement.classList.contains('incorrect')) {
            optionElement.style.borderColor = '#ccc';
            optionElement.style.backgroundColor = 'white';
          }
        });

        wrapper.appendChild(optionElement);
      });

      container.appendChild(wrapper);
      this.container = wrapper;
      console.log(`[Atom] ${this.context.bakerId} - ChoiceAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - ChoiceAtom渲染失败:`, error);
    }
  }

  private handleOptionClick(option: ChoiceOption, element: HTMLDivElement): void {
    const allOptions = this.container?.querySelectorAll('div[data-option-index]');
    allOptions?.forEach(opt => {
      const optElement = opt as HTMLDivElement;
      optElement.style.pointerEvents = 'none';
      optElement.style.borderColor = '#ccc';
      optElement.style.backgroundColor = 'white';
    });

    const isCorrect = option.isCorrect ?? false;

    if (isCorrect) {
      element.classList.add('correct');
      element.style.borderColor = '#52c41a';
      element.style.backgroundColor = '#f6ffed';
      element.style.color = 'rgb(82, 196, 26)';
    } else {
      element.classList.add('incorrect');
      element.style.borderColor = '#ff4d4f';
      element.style.backgroundColor = '#fff2f0';
      element.style.color = 'rgb(255, 77, 79)';
    }

    this.config.onSelect?.(option.value, isCorrect);

    if (isCorrect) {
      this.config.onCorrect?.();
    } else {
      this.config.onIncorrect?.();
    }
  }

  public getValue(): string {
    const selected = this.container?.querySelector('.correct, .incorrect');
    const indexStr = selected?.getAttribute('data-option-index') ?? '';
    if (indexStr !== '') {
      const index = parseInt(indexStr, 10);
      if (!isNaN(index) && this.config.options[index]) {
        return this.config.options[index].value;
      }
    }
    return '';
  }

  public reset(): void {
    const allOptions = this.container?.querySelectorAll('div[data-option-index]');
    allOptions?.forEach(opt => {
      const optElement = opt as HTMLDivElement;
      optElement.classList.remove('correct', 'incorrect');
      optElement.style.pointerEvents = 'auto';
      optElement.style.borderColor = '#ccc';
      optElement.style.backgroundColor = 'white';
      optElement.style.color = `rgb(${this.config.color?.[0] ?? 51}, ${this.config.color?.[1] ?? 51}, ${this.config.color?.[2] ?? 51})`;
    });
  }

  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    console.log(`[Atom] ${this.context.bakerId} - ChoiceAtom已销毁`);
  }
}
