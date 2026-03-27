import type { AtomContext } from '../atoms';

export interface AudioAtomConfig {
  id: string;
  src: string;
  position?: { x: number; y: number; z?: number };
  /** 宽度（默认300） */
  width?: number;
  /** 高度（默认42） */
  height?: number;
  /** 自动播放 */
  autoplay?: boolean;
  /** 循环播放 */
  loop?: boolean;
  /** 静音播放（常用于自动播放策略） */
  muted?: boolean;
}

export class AudioAtom {
  readonly capability: 'audio' = 'audio';
  readonly context: AtomContext;
  readonly id: string;

  constructor(context: AtomContext, container: HTMLElement, config: AudioAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: AudioAtomConfig): void {
    try {
      const element = document.createElement('audio');
      element.src = config.src;
      element.controls = true;
      if (config.autoplay) element.autoplay = true;
      if (config.loop) element.loop = true;
      if (config.muted) element.muted = true;
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${config.width ?? 300}px;
        height: ${config.height ?? 42}px;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - AudioAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - AudioAtom渲染失败:`, error);
    }
  }
}
