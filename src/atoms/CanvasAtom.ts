import type { AtomContext } from '../atoms';

export interface CanvasAtomConfig {
  id: string;
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
  readonly id: string;
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
    this.id = config.id;
    this.canvasWidth = config.width ?? 400;
    this.canvasHeight = config.height ?? 300;
    this.blackboardStyle = config.blackboardStyle ?? false;
    this.currentColor = config.strokeColor ?? [0, 0, 0];
    this.currentWidth = config.strokeWidth ?? 2;
    this.render(container, config);
  }

  private render(container: HTMLElement, config: CanvasAtomConfig): void {
    try {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-atom-id', this.id);
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
    const minW = widths[0];
    const maxW = widths[widths.length - 1];
    const toolbarScale = Math.min(1, Math.max(0.4, this.canvasWidth / 550));

    const toolbar = document.createElement('div');
    const toolbarWidth = Math.min(this.canvasWidth - 24, 400);
    toolbar.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%) scale(${toolbarScale});
      transform-origin: center bottom;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      width: ${toolbarWidth}px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.5);
      pointer-events: auto;
    `;

    const previewSize = Math.max(8, Math.min(Math.round(this.currentWidth * 2), 30));

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = `#${this.currentColor[0].toString(16).padStart(2,'0')}${this.currentColor[1].toString(16).padStart(2,'0')}${this.currentColor[2].toString(16).padStart(2,'0')}`;
    colorInput.style.cssText = `
      width: ${previewSize}px;
      height: ${previewSize}px;
      min-width: ${previewSize}px;
      min-height: ${previewSize}px;
      padding: 0;
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      background: rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]});
      cursor: pointer;
      flex-shrink: 0;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    `;
    colorInput.oninput = () => {
      const hex = colorInput.value.replace('#', '');
      this.currentColor = [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
      this.isEraser = false;
      colorInput.style.background = `rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]})`;
    };
    colorInput.onchange = () => {
      const hex = colorInput.value.replace('#', '');
      this.currentColor = [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
      this.isEraser = false;
      colorInput.style.background = `rgb(${this.currentColor[0]},${this.currentColor[1]},${this.currentColor[2]})`;
    };
    toolbar.appendChild(colorInput);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(minW);
    slider.max = String(maxW);
    slider.value = String(this.currentWidth);
    slider.step = '1';
    slider.style.cssText = `
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      outline: none;
      cursor: pointer;
      -webkit-appearance: none;
    `;
    slider.oninput = () => {
      this.currentWidth = Number(slider.value);
      this.isEraser = false;
      const s = Math.max(8, Math.min(Math.round(this.currentWidth * 2), 30));
      colorInput.style.width = `${s}px`;
      colorInput.style.height = `${s}px`;
      colorInput.style.minWidth = `${s}px`;
      colorInput.style.minHeight = `${s}px`;
    };
    toolbar.appendChild(slider);

    const svgBtn = (onClick: () => void, pathD: string, viewBox = '0 0 24 24') => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        width: 30px;
        height: 30px;
        padding: 0;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      `;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="${viewBox}" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${pathD}"/></svg>`;
      btn.onclick = onClick;
      return btn;
    };

    // eraser icon — Lucide (MIT), https://lucide.dev
    const eraserBtn = svgBtn(
      () => {
        this.isEraser = !this.isEraser;
        eraserBtn.style.background = this.isEraser ? '#e8f0ff' : '#fff';
        eraserBtn.style.borderColor = this.isEraser ? '#007aff' : 'rgba(0,0,0,0.15)';
      },
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'
    );
    toolbar.appendChild(eraserBtn);

    // trash icon — Heroicons (MIT), https://heroicons.com
    const clearBtn = svgBtn(
      () => {
        this.strokes = [];
        this.redraw();
      },
      'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    );
    toolbar.appendChild(clearBtn);

    // save (floppy) icon — Heroicons (MIT), https://heroicons.com
    const saveBtn = svgBtn(
      () => {
        const link = document.createElement('a');
        link.download = 'canvas.png';
        link.href = this.canvas!.toDataURL('image/png');
        link.click();
      },
      'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
    );
    toolbar.appendChild(saveBtn);

    return toolbar;
  }

  private setupResize(canvasWrapper: HTMLElement, canvas: HTMLCanvasElement, config: CanvasAtomConfig): void {
    const handle = document.createElement('div');
    const minW = config.minWidth ?? 350;
    const minH = config.minHeight ?? 150;

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
      // 同步更新canvas实际像素尺寸，确保绘画区域真实缩放
      canvas.width = newW;
      canvas.height = newH;
      this.canvasWidth = newW;
      this.canvasHeight = newH;
      this.redraw();
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
