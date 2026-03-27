import type { AtomContext } from '../atoms';

/**
 * 视频原子
 * 功能：在分子容器内渲染视频播放器
 * DOM：✅ 有DOM - 创建一个video元素
 * 
 * 特点：
 * - 绝对定位在容器内指定位置
 * - 宽高可选，默认由视频本身决定
 * - 支持浏览器原生视频控制（播放、暂停、音量等）
 * - 支持多种视频格式（mp4, webm, ogg等）
 * 
 * @example
 * {
 *   capability: 'video',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   src: 'https://example.com/video.mp4',
 *   width: 400,
 *   height: 300
 * }
 */
export interface VideoAtomConfig {
  id: string;
  src: string;
  width?: number;
  height?: number;
  position?: { x: number; y: number; z?: number };
}

export class VideoAtom {
  readonly capability: 'video' = 'video';
  readonly context: AtomContext;
  readonly id: string;

  constructor(context: AtomContext, container: HTMLElement, config: VideoAtomConfig) {
    this.context = context;
    this.id = config.id;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: VideoAtomConfig): void {
    try {
      const element = document.createElement('video');
      element.src = config.src;
      element.controls = true;
      if (config.width) element.width = config.width;
      if (config.height) element.height = config.height;
      element.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
      `;
      container.appendChild(element);
      console.log(`[Atom] ${this.context.bakerId} - VideoAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - VideoAtom渲染失败:`, error);
    }
  }
}
