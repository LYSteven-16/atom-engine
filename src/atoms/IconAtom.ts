import type { AtomContext } from '../atoms';

export interface IconAtomConfig {
  id: string;
  icon?: string;
  svg?: string;
  svgUrl?: string;
  size?: number;
  color?: [number, number, number];
  position?: { x: number; y: number; z?: number };
}

export class IconAtom {
  readonly capability: 'icon' = 'icon';
  readonly context: AtomContext;
  readonly id: string;

  constructor(context: AtomContext, container: HTMLElement, config: IconAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: IconAtomConfig): void {
    try {
      const element = document.createElement('div');
      element.setAttribute('data-atom-id', this.id);
      
      const size = config.size ?? 24;
      const color = config.color ?? [51, 51, 51];

      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgb(${color[0]}, ${color[1]}, ${color[2]});
      `;

      // 支持 SVG 内容
      if (config.svg) {
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = config.svg;
        const svgElement = svgContainer.querySelector('svg');
        if (svgElement) {
          svgElement.setAttribute('width', `${size}px`);
          svgElement.setAttribute('height', `${size}px`);
          svgElement.style.fill = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          element.appendChild(svgElement);
        }
      }
      // 支持 SVG URL
      else if (config.svgUrl) {
        const img = document.createElement('img');
        img.src = config.svgUrl;
        img.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          filter: invert(${color[0] / 255}) invert(${color[1] / 255}) invert(${color[2] / 255});
        `;
        element.appendChild(img);
      }
      // 支持 emoji 或文本图标
      else if (config.icon) {
        element.textContent = config.icon;
        element.style.fontSize = `${size}px`;
      }

      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - IconAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - IconAtom渲染失败:`, error);
    }
  }
}
