import type { AtomContext } from '../atoms';

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
  private blackboardStyle = false;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private currentColor: [number, number, number] = [0, 0, 0];
  private currentWidth = 2;
  private isEraser = false;
  private isDrawing = false;
  private currentStroke: Stroke | null = null;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(context: AtomContext, container: HTMLElement, config: CanvasAtomConfig) {
    this.context = context;
    this.canvasWidth = config.width;
    this.canvasHeight = config.height;
    this.blackboardStyle = config.blackboardStyle ?? false;
    this.currentColor = config.strokeColor ?? [0, 0, 0];
    this.currentWidth = config.strokeWidth ?? 2;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: CanvasAtomConfig): void {
    try {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        display: inline-block;
      `;

      if (config.showToolbar) {
        const toolbar = document.createElement('div');
        const colors = config.defaultColors ?? [[0, 0, 0], [255, 0, 0], [0, 128, 0], [0, 0, 255], [255, 165, 0], [128, 0, 128]];
        const widths = config.defaultWidths ?? [2, 4, 6, 8];

        toolbar.style.cssText = `
          display: flex;
          gap: 6px;
          padding: 6px 8px;
          background: #f0f0f0;
          border-radius: 8px 8px 0 0;
          border: 1px solid #ddd;
          border-bottom: none;
          flex-wrap: wrap;
          align-items: center;
        `;

        colors.forEach(color => {
          const btn = document.createElement('button');
          btn.style.cssText = `
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid transparent;
            background: rgb(${color[0]},${color[1]},${color[2]});
            cursor: pointer;
          `;
          btn.onclick = () => {
            this.currentColor = color;
            this.isEraser = false;
            this.updateToolbarState(toolbar);
          };
          toolbar.appendChild(btn);
        });

        widths.forEach(w => {
          const btn = document.createElement('button');
          btn.style.cssText = `
            width: 28px;
            height: 20px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: #fff;
            cursor: pointer;
            font-size: 10px;
          `;
          btn.textContent = `${w}`;
          btn.onclick = () => {
            this.currentWidth = w;
            this.updateToolbarState(toolbar);
          };
          toolbar.appendChild(btn);
        });

        const eraserBtn = document.createElement('button');
        eraserBtn.textContent = '⌫';
        eraserBtn.style.cssText = `
          padding: 2px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
        `;
        eraserBtn.onclick = () => {
          this.isEraser = !this.isEraser;
          this.updateToolbarState(toolbar);
        };
        toolbar.appendChild(eraserBtn);

        const clearBtn = document.createElement('button');
        clearBtn.textContent = '✕';
        clearBtn.style.cssText = `
          padding: 2px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
        `;
        clearBtn.onclick = () => {
          this.strokes = [];
          this.redraw();
        };
        toolbar.appendChild(clearBtn);

        wrapper.appendChild(toolbar);
      }

      const canvasWrapper = document.createElement('div');
      canvasWrapper.style.cssText = `
        position: relative;
        width: ${this.canvasWidth}px;
        height: ${this.canvasHeight}px;
        border-radius: ${config.showToolbar ? '0 0 8px 8px' : '8px'};
        overflow: hidden;
      `;

      const canvas = document.createElement('canvas');
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      canvas.style.cssText = `
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        cursor: crosshair;
      `;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;

      if (config.blackboardStyle) {
        canvas.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)';
        this.ctx.fillStyle = '#2d5a2d';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      } else if (config.backgroundColor) {
        this.ctx.fillStyle = `rgb(${config.backgroundColor[0]},${config.backgroundColor[1]},${config.backgroundColor[2]})`;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      }

      this.setupDrawing(canvas, config);
      canvasWrapper.appendChild(canvas);

      if (config.resizable) {
        this.setupResize(canvasWrapper, canvas, config);
      }

      wrapper.appendChild(canvasWrapper);
      container.appendChild(wrapper);
      console.log(`[Atom] ${this.context.bakerId} - CanvasAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CanvasAtom渲染失败:`, error);
    }
  }

  private updateToolbarState(_toolbar: HTMLElement): void {
  }

  private setupDrawing(canvas: HTMLCanvasElement, _config: CanvasAtomConfig): void {
    canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.currentStroke = {
        points: [{ x, y }],
        color: this.currentColor,
        width: this.currentWidth,
        isEraser: this.isEraser
      };
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing || !this.currentStroke) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.currentStroke.points.push({ x, y });
      this.redraw();
      this.drawStroke(this.currentStroke);
    });

    const stopDrawing = () => {
      if (this.isDrawing && this.currentStroke) {
        this.strokes.push(this.currentStroke);
        this.currentStroke = null;
      }
      this.isDrawing = false;
    };

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
  }

  private setupResize(canvasWrapper: HTMLElement, _canvas: HTMLCanvasElement, config: CanvasAtomConfig): void {
    const handle = document.createElement('div');
    const minW = config.minWidth ?? 100;
    const minH = config.minHeight ?? 60;

    handle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: se-resize;
      background: linear-gradient(135deg, transparent 50%, #aaa 50%);
      border-radius: 0 0 8px 0;
    `;

    let startX = 0, startY = 0, startW = 0, startH = 0;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newW = Math.max(minW, startW + dx);
      const newH = Math.max(minH, startH + dy);
      canvasWrapper.style.width = `${newW}px`;
      canvasWrapper.style.height = `${newH}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startW = canvasWrapper.offsetWidth;
      startH = canvasWrapper.offsetHeight;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    canvasWrapper.appendChild(handle);
  }

  private redraw(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.blackboardStyle) {
      this.ctx.fillStyle = '#2d5a2d';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.strokes.forEach(s => this.drawStroke(s));
  }

  private drawStroke(stroke: Stroke): void {
    if (!this.ctx || stroke.points.length < 2) return;
    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.isEraser ? (this.blackboardStyle ? '#2d5a2d' : '#ffffff') : `rgb(${stroke.color[0]},${stroke.color[1]},${stroke.color[2]})`;
    this.ctx.lineWidth = stroke.isEraser ? stroke.width * 3 : stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    this.ctx.stroke();
  }
}
