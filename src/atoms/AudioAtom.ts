import type { AtomContext } from '../atoms';

/**
 * 音频原子
 * 功能：在分子容器内渲染音频播放器
 * DOM：✅ 有DOM - 创建一个audio元素
 * 
 * 特点：
 * - 绝对定位在容器内指定位置
 * - 支持浏览器原生音频控制（播放、暂停、音量等）
 * - 支持多种音频格式（mp3, wav, ogg等）
 * - 通常用于背景音乐或音效
 * 
 * @example
 * {
 *   capability: 'audio',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   src: 'https://example.com/audio.mp3'
 * }
 */
export interface AudioAtomConfig {
  src: string;
  position?: { x: number; y: number; z?: number };
}

export class AudioAtom {
  readonly capability: 'audio' = 'audio';
  readonly context: AtomContext;

  constructor(context: AtomContext, container: HTMLElement, config: AudioAtomConfig) {
    this.render(container, config);
  }

  private render(container: HTMLElement, config: AudioAtomConfig): void {
    try {
      const element = document.createElement('audio');
      element.src = config.src;
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - AudioAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - AudioAtom渲染失败:`, error);
    }
  }
}
