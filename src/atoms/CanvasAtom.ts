import type { AtomContext } from '../atoms';

/**
 * 画布原子
 * 功能：在分子容器内渲染可绑图画的画布
 * DOM：✅ 有DOM - 创建一个div容器包裹canvas元素
 * 
 * 特点：
 * - 支持鼠标绑图画
 * - 支持黑板模式（深绿色背景、模拟粉笔效果）
 * - 支持自定义画笔颜色和线条宽度
 * - 支持橡皮擦模式
 * - 保存所有笔画历史，支持重绘
 * 
 * 使用场景：
 * - 电子白板
 * - 手写签名
 * - 简单绑图工具
 * 
 * 交互方式：
 * - mousedown: 开始绑图
 * - mousemove: 绑制线条
 * - mouseup/mouseleave: 结束当前笔画
 * 
 * @example
 * {
 *   capability: 'canvas',
 *   context: { bakerId: 'baker-0', bakerIndex: 0, atomIndex: 0 },
 *   width: 400,
 *   height: 300,
 *   strokeColor: [0, 0, 0],
 *   strokeWidth: 2
 * }
 */
export interface CanvasAtomConfig {
  width: number;
  height: number;
  position?: { x: number; y: number; z?: number };
  strokeColor?: [number, number, number];
  strokeWidth?: number;
  backgroundColor?: [number, number, number];
  blackboardStyle?: boolean;
  defaultColors?: [number, number, number][];
  defaultWidths?: number[];
  showToolbar?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: [number, number, number];
  width: number;
  isEraser: boolean;
}

export class CanvasAtom {
  readonly capability: 'canvas' = 'canvas';
  readonly context: AtomContext;
  readonly width: number;
  readonly height: number;

  constructor(context: AtomContext, container: HTMLElement, config: CanvasAtomConfig) {
    this.context = context;
    this.width = config.width;
    this.height = config.height;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: CanvasAtomConfig): void {
    try {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${config.width}px;
        height: ${config.height}px;
      `;

      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      canvas.style.cssText = `
        display: block;
        position: absolute;
        top: 0;
        left: 0;
      `;

      if (config.blackboardStyle) {
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)';
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a3a1a';
          ctx.fillRect(0, 0, config.width, config.height);
          ctx.fillStyle = '#2d5a2d';
          ctx.fillRect(0, 0, config.width, config.height);
        }
      } else if (config.backgroundColor) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = `rgb(${config.backgroundColor[0]}, ${config.backgroundColor[1]}, ${config.backgroundColor[2]})`;
          ctx.fillRect(0, 0, config.width, config.height);
        }
      }

      (canvas as any).strokes = [];
      this.setupDrawing(canvas, config);

      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
      console.log(`[Atom] ${this.context.bakerId} - CanvasAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CanvasAtom渲染失败:`, error);
    }
  }

  private setupDrawing(canvas: HTMLCanvasElement, config: CanvasAtomConfig): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDrawing = false;
    let currentStroke: Stroke | null = null;
    let currentColor = config.strokeColor ?? [0, 0, 0];
    let currentWidth = config.strokeWidth ?? 2;
    let isEraser = false;

    const getStrokes = (): Stroke[] => (canvas as any).strokes || [];
    const setStrokes = (strokes: Stroke[]) => { (canvas as any).strokes = strokes; };

    const startDrawing = (e: MouseEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      currentStroke = {
        points: [{ x, y }],
        color: currentColor,
        width: currentWidth,
        isEraser
      };
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing || !currentStroke) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      currentStroke.points.push({ x, y });

      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      if (config.blackboardStyle) {
        ctx!.fillStyle = '#2d5a2d';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
      }
      getStrokes().forEach(stroke => this.drawStroke(ctx!, stroke));
      this.drawStroke(ctx!, currentStroke);
    };

    const stopDrawing = () => {
      if (isDrawing && currentStroke) {
        getStrokes().push(currentStroke);
        currentStroke = null;
      }
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
  }

  private drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.isEraser ? (this as any).config?.blackboardStyle ? '#2d5a2d' : '#ffffff' : `rgb(${stroke.color[0]}, ${stroke.color[1]}, ${stroke.color[2]})`;
    ctx.lineWidth = stroke.isEraser ? stroke.width * 3 : stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
}
