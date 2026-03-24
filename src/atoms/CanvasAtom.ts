import type { AtomContext } from '../atoms';

export interface CanvasAtomConfig {
  width: number;
  height: number;
  position?: { x: number; y: number; z?: number };
  strokeColor?: [number, number, number];
  strokeWidth?: number;
  backgroundColor?: [number, number, number];
  blackboardStyle?: boolean;
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

      const canvasWrapper = document.createElement('div');
      canvasWrapper.style.cssText = `
        position: relative;
        width: ${this.canvasWidth}px;
        height: ${this.canvasHeight}px;
        border-radius: 8px;
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

      if (config.showToolbar) {
        const toolbar = this.createToolbar(canvas, config);
        canvasWrapper.appendChild(toolbar);
      }

      wrapper.appendChild(canvasWrapper);
      container.appendChild(wrapper);
      console.log(`[Atom] ${this.context.bakerId} - CanvasAtom渲染成功`);
    } catch (error) {
      console.error(`[Atom Error] ${this.context.bakerId} - CanvasAtom渲染失败:`, error);
    }
  }

  private createToolbar(_canvas: HTMLCanvasElement, config: CanvasAtomConfig): HTMLElement {
    const widths = config.defaultWidths ?? [1, 2, 4, 6, 8, 12, 16, 20];
    const toolbar = document.createElement('div');
    const toolbarWidth = Math.min(this.canvasWidth - 24, 360);
    toolbar.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      width: ${toolbarWidth}px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.5);
    `;

    const preview = document.createElement('div');
    preview.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]});
      border: 2px solid rgba(255,255,255,0.8);
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      cursor: pointer;
      flex-shrink: 0;
    `;
    preview.onclick = () => {
      const input = document.createElement('input');
      input.type = 'color';
      input.value = `#${this.currentColor[0].toString(16).padStart(2,'0')}${this.currentColor[1].toString(16).padStart(2,'0')}${this.currentColor[2].toString(16).padStart(2,'0')}`;
      input.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
      input.onchange = () => {
        const hex = input.value.replace('#', '');
        this.currentColor = [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
        this.isEraser = false;
        preview.style.background = `rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]})`;
      };
      document.body.appendChild(input);
      input.click();
      input.remove();
    };
    toolbar.appendChild(preview);

    const sliderWrap = document.createElement('div');
    sliderWrap.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    widths.forEach(w => {
      const dot = document.createElement('div');
      dot.style.cssText = `
        flex: 1;
        height: ${Math.min(w, 20)}px;
        max-height: 20px;
        border-radius: 10px;
        background: #333;
        cursor: pointer;
      `;
      dot.onclick = () => {
        this.currentWidth = w;
        this.isEraser = false;
        const size = Math.max(8, Math.min(w + 4, 24));
        preview.style.width = `${size}px`;
        preview.style.height = `${size}px`;
      };
      dot.onmouseenter = () => { dot.style.background = '#007aff'; };
      dot.onmouseleave = () => { dot.style.background = '#333'; };
      sliderWrap.appendChild(dot);
    });
    toolbar.appendChild(sliderWrap);

    const eraserBtn = document.createElement('button');
    eraserBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 999px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      flex-shrink: 0;
    `;
    eraserBtn.textContent = '橡皮';
    eraserBtn.onclick = () => {
      this.isEraser = !this.isEraser;
      eraserBtn.style.background = this.isEraser ? '#e8f0ff' : '#fff';
      eraserBtn.style.borderColor = this.isEraser ? '#007aff' : 'rgba(0,0,0,0.15)';
      eraserBtn.style.color = this.isEraser ? '#007aff' : '#333';
    };
    toolbar.appendChild(eraserBtn);

    const clearBtn = document.createElement('button');
    clearBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 999px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      flex-shrink: 0;
    `;
    clearBtn.textContent = '清空';
    clearBtn.onclick = () => {
      this.strokes = [];
      this.redraw();
    };
    toolbar.appendChild(clearBtn);

    const saveBtn = document.createElement('button');
    saveBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 999px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      flex-shrink: 0;
    `;
    saveBtn.textContent = '保存';
    saveBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = 'canvas.png';
      link.href = this.canvas!.toDataURL('image/png');
      link.click();
    };
    toolbar.appendChild(saveBtn);

    return toolbar;
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
