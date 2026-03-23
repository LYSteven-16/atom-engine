import type {
  Atom, TextAtom, ImageAtom, VideoAtom, AudioAtom, CodeAtom, IconAtom, CanvasAtom,
  BackgroundAtom, BorderAtom, ShadowAtom, ResizeHandleAtom, CSSProperties
} from './types';

export interface RenderResult {
  id: string;
  success: boolean;
  element?: HTMLElement;
  error?: string;
}

export class AtomRenderer {
  render(atom: Atom): RenderResult {
    try {
      const id = atom.id ?? `atom-${atom.capability}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let element: HTMLElement;

      switch (atom.capability) {
        case 'text':
          element = this.renderText(atom as TextAtom);
          break;
        case 'image':
          element = this.renderImage(atom as ImageAtom);
          break;
        case 'video':
          element = this.renderVideo(atom as VideoAtom);
          break;
        case 'audio':
          element = this.renderAudio(atom as AudioAtom);
          break;
        case 'code':
          element = this.renderCode(atom as CodeAtom);
          break;
        case 'icon':
          element = this.renderIcon(atom as IconAtom);
          break;
        case 'canvas':
          element = this.renderCanvas(atom as CanvasAtom);
          break;
        case 'background':
          element = this.renderBackground(atom as BackgroundAtom);
          break;
        case 'border':
          element = this.renderBorder(atom as BorderAtom);
          break;
        case 'shadow':
          element = this.renderShadow(atom as ShadowAtom);
          break;
        case 'resize-handle':
          element = this.renderResizeHandle(atom as ResizeHandleAtom);
          break;
        default:
          element = document.createElement('div');
      }

      element.setAttribute('data-atom-id', id);
      return { id, success: true, element };

    } catch (error) {
      const id = atom.id ?? 'unknown';
      return { id, success: false, error: String(error) };
    }
  }

  private renderText(atom: TextAtom): HTMLElement {
    const el = document.createElement('div');
    el.textContent = atom.text;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      fontSize: `${atom.size}px`,
      color: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      lineHeight: 1.4,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderImage(atom: ImageAtom): HTMLElement {
    const el = document.createElement('img');
    el.src = atom.src;
    el.alt = atom.alt || '';
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      width: `${atom.width}px`,
      height: `${atom.height}px`,
      objectFit: 'cover',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderVideo(atom: VideoAtom): HTMLElement {
    const el = document.createElement('video');
    el.src = atom.src;
    if (atom.width) el.width = atom.width;
    if (atom.height) el.height = atom.height;
    el.controls = true;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderAudio(atom: AudioAtom): HTMLElement {
    const el = document.createElement('audio');
    el.src = atom.src;
    el.controls = true;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderCode(atom: CodeAtom): HTMLElement {
    const el = document.createElement('pre');
    el.textContent = atom.code;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      backgroundColor: '#f5f5f5',
      padding: '12px',
      borderRadius: '6px',
      overflow: 'auto',
      fontSize: '14px',
      fontFamily: 'monospace',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderIcon(atom: IconAtom): HTMLElement {
    const el = document.createElement('span');
    el.textContent = atom.icon;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      fontSize: `${atom.size || 24}px`,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderCanvas(atom: CanvasAtom): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('canvas-container');
    container.style.position = 'absolute';
    container.style.left = `${atom.position?.x ?? 0}px`;
    container.style.top = `${atom.position?.y ?? 0}px`;
    container.style.zIndex = `${atom.position?.z ?? 10}`;
    container.style.width = `${atom.width}px`;
    container.style.height = `${atom.height}px`;

    const canvas = document.createElement('canvas');
    canvas.width = atom.width;
    canvas.height = atom.height;
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    if (atom.blackboardStyle) {
      canvas.style.borderRadius = '8px';
      canvas.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, atom.width, atom.height);
        ctx.fillStyle = '#2d5a2d';
        ctx.fillRect(0, 0, atom.width, atom.height);
        for (let i = 0; i < atom.width; i += 4) {
          for (let j = 0; j < atom.height; j += 4) {
            if (Math.random() > 0.5) {
              ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
              ctx.fillRect(i, j, 2, 2);
            }
          }
        }
      }
    } else if (atom.backgroundColor) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = `rgb(${atom.backgroundColor[0]}, ${atom.backgroundColor[1]}, ${atom.backgroundColor[2]})`;
        ctx.fillRect(0, 0, atom.width, atom.height);
      }
    }

    container.appendChild(canvas);

    if (atom.showToolbar !== false) {
      const isBlackboard = atom.blackboardStyle;
      const toolbar = document.createElement('div');
      toolbar.style.position = 'absolute';
      toolbar.style.bottom = '8px';
      toolbar.style.left = '50%';
      toolbar.style.transform = 'translateX(-50%)';
      toolbar.style.display = 'flex';
      toolbar.style.alignItems = 'center';
      toolbar.style.gap = '8px';
      toolbar.style.padding = '6px 10px';
      toolbar.style.background = isBlackboard ? 'rgba(60, 90, 60, 0.9)' : 'rgba(255, 255, 255, 0.95)';
      toolbar.style.borderRadius = '8px';
      toolbar.style.boxShadow = isBlackboard ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.1)';
      toolbar.style.zIndex = '10';

      const colors = atom.defaultColors || [[0, 0, 0], [255, 0, 0], [0, 128, 0], [0, 0, 255]];
      const widths = atom.defaultWidths || [2, 4, 8];

      const colorGroup = document.createElement('div');
      colorGroup.style.display = 'flex';
      colorGroup.style.gap = '6px';
      colors.forEach((color, idx) => {
        const btn = document.createElement('button');
        btn.dataset.color = JSON.stringify(color);
        btn.style.width = '24px';
        btn.style.height = '24px';
        btn.style.borderRadius = '50%';
        btn.style.border = idx === 0 ? '3px solid #fff' : '2px solid rgba(100, 140, 100, 0.6)';
        btn.style.background = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = idx === 0 ? '0 0 8px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)';
        btn.style.outline = 'none';
        btn.style.opacity = idx === 0 ? '1' : '0.7';
        colorGroup.appendChild(btn);
      });

      const widthGroup = document.createElement('div');
      widthGroup.style.display = 'flex';
      widthGroup.style.gap = '6px';
      widthGroup.style.alignItems = 'center';
      widthGroup.style.marginLeft = '8px';
      widths.forEach((w, idx) => {
        const btn = document.createElement('button');
        btn.dataset.width = String(w);
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.borderRadius = '6px';
        btn.style.border = idx === 0 ? '2px solid #fff' : '1px solid rgba(100, 140, 100, 0.5)';
        btn.style.background = idx === 0 ? 'rgba(60, 100, 60, 0.9)' : 'rgba(40, 70, 40, 0.7)';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.boxShadow = idx === 0 ? '0 0 6px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.2)';
        btn.style.outline = 'none';
        btn.style.opacity = idx === 0 ? '1' : '0.7';
        const dot = document.createElement('div');
        dot.style.width = `${Math.min(w, 14)}px`;
        dot.style.height = `${Math.min(w, 14)}px`;
        dot.style.borderRadius = '50%';
        dot.style.background = '#c8e0c8';
        dot.style.boxShadow = '0 1px 1px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2)';
        btn.appendChild(dot);
        widthGroup.appendChild(btn);
      });

      const eraserBtn = document.createElement('button');
      eraserBtn.textContent = '🧹';
      eraserBtn.style.width = '32px';
      eraserBtn.style.height = '32px';
      eraserBtn.style.borderRadius = '6px';
      eraserBtn.style.border = '1px solid rgba(100, 140, 100, 0.5)';
      eraserBtn.style.background = 'rgba(40, 70, 40, 0.7)';
      eraserBtn.style.cursor = 'pointer';
      eraserBtn.style.marginLeft = '8px';
      eraserBtn.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
      eraserBtn.style.outline = 'none';
      eraserBtn.title = '橡皮擦';

      const clearBtn = document.createElement('button');
      clearBtn.textContent = '🗑️';
      clearBtn.style.width = '32px';
      clearBtn.style.height = '32px';
      clearBtn.style.borderRadius = '6px';
      clearBtn.style.border = '1px solid rgba(100, 140, 100, 0.5)';
      clearBtn.style.background = 'rgba(40, 70, 40, 0.7)';
      clearBtn.style.cursor = 'pointer';
      clearBtn.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
      clearBtn.style.outline = 'none';
      clearBtn.title = '清除全部';

      toolbar.appendChild(colorGroup);
      toolbar.appendChild(widthGroup);
      toolbar.appendChild(eraserBtn);
      toolbar.appendChild(clearBtn);
      container.appendChild(toolbar);
    }

    if (atom.resizable !== false) {
      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.right = '4px';
      resizeHandle.style.bottom = '4px';
      resizeHandle.style.width = '16px';
      resizeHandle.style.height = '16px';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.zIndex = '20';

      const handleColor = atom.blackboardStyle ? 'rgba(200, 220, 200, 0.7)' : 'rgba(100, 100, 100, 0.5)';
      resizeHandle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M14 14 L14 8 L8 14 Z" fill="${handleColor}"/>
          <path d="M10 14 L10 10 L6 14 Z" fill="${handleColor}"/>
        </svg>
      `;

      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let initialWidth = 0;
      let initialHeight = 0;
      let ghostElement: HTMLElement | null = null;
      let originalStrokes: any[] = [];

      const getStrokes = (): any[] => {
        return (canvas as any).strokes || [];
      };

      const setStrokes = (strokes: any[]) => {
        (canvas as any).strokes = strokes;
      };

      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        initialWidth = canvas.width;
        initialHeight = canvas.height;
        originalStrokes = JSON.parse(JSON.stringify(getStrokes()));

        ghostElement = document.createElement('div');
        ghostElement.style.position = 'fixed';
        ghostElement.style.border = '2px dashed rgba(100, 150, 255, 0.9)';
        ghostElement.style.borderRadius = '8px';
        ghostElement.style.pointerEvents = 'none';
        ghostElement.style.zIndex = '100000';
        ghostElement.style.boxSizing = 'border-box';
        ghostElement.style.width = `${initialWidth}px`;
        ghostElement.style.height = `${initialHeight}px`;
        ghostElement.style.backgroundColor = 'rgba(100, 150, 255, 0.1)';
        document.body.appendChild(ghostElement);

        const rect = canvas.getBoundingClientRect();
        ghostElement.style.left = `${rect.left}px`;
        ghostElement.style.top = `${rect.top}px`;
      });

      const redrawStrokes = (strokes: any[], newWidth: number, newHeight: number) => {
        const minW = atom.minWidth ?? 100;
        const minH = atom.minHeight ?? 60;
        const scaleX = Math.max(minW, newWidth) / initialWidth;
        const scaleY = Math.max(minH, newHeight) / initialHeight;

        canvas.width = Math.max(minW, newWidth);
        canvas.height = Math.max(minH, newHeight);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (atom.blackboardStyle) {
          ctx.fillStyle = '#2d5a2d';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < canvas.width; i += 4) {
            for (let j = 0; j < canvas.height; j += 4) {
              if (Math.random() > 0.5) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
                ctx.fillRect(i, j, 2, 2);
              }
            }
          }
        } else {
          ctx.fillStyle = atom.backgroundColor ? `rgb(${atom.backgroundColor[0]}, ${atom.backgroundColor[1]}, ${atom.backgroundColor[2]})` : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const scale = Math.min(scaleX, scaleY);
        strokes.forEach((stroke: any) => {
          if (stroke.points.length < 2) return;

          if (stroke.isEraser) {
            ctx.strokeStyle = atom.blackboardStyle ? '#2d5a2d' : '#ffffff';
            ctx.lineWidth = stroke.width * 3 * scale;
          } else {
            ctx.strokeStyle = `rgb(${stroke.color[0]}, ${stroke.color[1]}, ${stroke.color[2]})`;
            ctx.lineWidth = stroke.width * scale;
          }
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
          }
          ctx.stroke();

          for (let i = 0; i < stroke.points.length; i++) {
            stroke.points[i].x *= scaleX;
            stroke.points[i].y *= scaleY;
          }
          stroke.width *= scale;
        });

        setStrokes(strokes);
      };

      document.addEventListener('mousemove', (e) => {
        if (!isResizing || !ghostElement) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const minW = atom.minWidth ?? 100;
        const minH = atom.minHeight ?? 60;

        const newWidth = Math.max(minW, initialWidth + dx);
        const newHeight = Math.max(minH, initialHeight + dy);

        ghostElement.style.width = `${newWidth}px`;
        ghostElement.style.height = `${newHeight}px`;

        const rect = canvas.getBoundingClientRect();
        ghostElement.style.left = `${rect.left}px`;
        ghostElement.style.top = `${rect.top}px`;
      });

      document.addEventListener('mouseup', (e) => {
        if (!isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const minW = atom.minWidth ?? 100;
        const minH = atom.minHeight ?? 60;

        if (ghostElement) {
          ghostElement.remove();
          ghostElement = null;
        }

        const newWidth = Math.max(minW, initialWidth + dx);
        const newHeight = Math.max(minH, initialHeight + dy);

        redrawStrokes(originalStrokes, newWidth, newHeight);

        container.style.width = `${canvas.width}px`;
        container.style.height = `${canvas.height}px`;

        const event = new CustomEvent('canvas-resize', {
          detail: { width: canvas.width, height: canvas.height, atom }
        });
        container.dispatchEvent(event);

        isResizing = false;
      });

      container.appendChild(resizeHandle);
    }

    return container;
  }

  private renderBackground(atom: BackgroundAtom): HTMLElement {
    const el = document.createElement('div');
    
    const hasCustomPosition = atom.position?.x !== undefined || atom.position?.y !== undefined;
    const hasCustomSize = atom.width !== undefined || atom.height !== undefined;

    const styles: CSSProperties = {
      position: 'absolute',
      left: hasCustomPosition ? `${atom.position?.x ?? 0}px` : '0',
      top: hasCustomPosition ? `${atom.position?.y ?? 0}px` : '0',
      zIndex: atom.position?.z ?? 0,
      width: hasCustomSize ? `${atom.width ?? '100%'}` : '100%',
      height: hasCustomSize ? `${atom.height ?? '100%'}` : '100%',
      backgroundColor: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
      borderRadius: atom.radius !== undefined ? `${atom.radius}px` : '0px',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderBorder(atom: BorderAtom): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-border', 'true');

    const hasCustomPosition = atom.position?.x !== undefined || atom.position?.y !== undefined;
    const hasCustomSize = atom.borderWidth !== undefined || atom.borderHeight !== undefined;

    const styles: CSSProperties = {
      position: 'absolute',
      left: hasCustomPosition ? `${atom.position?.x ?? 0}px` : '0',
      top: hasCustomPosition ? `${atom.position?.y ?? 0}px` : '0',
      zIndex: atom.position?.z ?? 0,
      width: hasCustomSize ? `${atom.borderWidth ?? '100%'}` : '100%',
      height: hasCustomSize ? `${atom.borderHeight ?? '100%'}` : '100%',
      boxSizing: 'border-box',
      border: `${atom.width}px solid rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
      borderRadius: atom.radius ? `${atom.radius}px` : '0px',
    };

    this.applyStyles(el, styles);
    return el;
  }

  private renderShadow(atom: ShadowAtom): HTMLElement {
    const el = document.createElement('div');
    
    const hasCustomPosition = atom.position?.x !== undefined || atom.position?.y !== undefined;
    const hasCustomSize = atom.shadowWidth !== undefined || atom.shadowHeight !== undefined;

    const styles: CSSProperties = {
      position: 'absolute',
      left: hasCustomPosition ? `${atom.position?.x ?? 0}px` : '0',
      top: hasCustomPosition ? `${atom.position?.y ?? 0}px` : '0',
      zIndex: atom.position?.z ?? 0,
      width: hasCustomSize ? `${atom.shadowWidth ?? '100%'}` : '100%',
      height: hasCustomSize ? `${atom.shadowHeight ?? '100%'}` : '100%',
      boxShadow: `${atom.x}px ${atom.y}px ${atom.blur}px rgba(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]}, 0.25)`,
      borderRadius: atom.radius !== undefined ? `${atom.radius}px` : '0px',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderResizeHandle(atom: ResizeHandleAtom): HTMLElement {
    const handleSize = atom.handleSize ?? 16;
    const color = atom.handleColor ?? [255, 255, 255];
    const edge = atom.edge ?? 'se';

    let right: string | undefined = '4px';
    let bottom: string | undefined = '4px';
    let left: string | undefined = undefined;
    let top: string | undefined = undefined;
    let cursor = 'nwse-resize';

    switch (edge) {
      case 'nw':
        right = undefined;
        bottom = undefined;
        left = '4px';
        top = '4px';
        cursor = 'nwse-resize';
        break;
      case 'ne':
        bottom = undefined;
        left = undefined;
        top = '4px';
        cursor = 'nesw-resize';
        break;
      case 'sw':
        right = undefined;
        bottom = undefined;
        left = '4px';
        top = undefined;
        cursor = 'nesw-resize';
        break;
      case 'se':
      default:
        right = '4px';
        bottom = '4px';
        left = undefined;
        top = undefined;
        cursor = 'nwse-resize';
        break;
    }

    const el = document.createElement('div');
    el.setAttribute('data-resize-handle', edge);

    const styles: CSSProperties = {
      position: 'absolute',
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      cursor,
      zIndex: atom.position?.z ?? 100,
    };

    if (right !== undefined) styles.right = right;
    if (bottom !== undefined) styles.bottom = bottom;
    if (left !== undefined) styles.left = left;
    if (top !== undefined) styles.top = top;

    this.applyStyles(el, styles);
    el.innerHTML = `<svg width="${handleSize}" height="${handleSize}" viewBox="0 0 16 16" fill="none">
      <path d="M4 12L12 4M8 12L12 8M12 12V12.5" stroke="rgba(${color[0]},${color[1]},${color[2]},0.5)" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

    return el;
  }

  private applyStyles(element: HTMLElement, styles: CSSProperties): void {
    Object.entries(styles).forEach(([key, value]) => {
      if (value !== undefined) {
        (element.style as any)[key] = value;
      }
    });
  }
}

export const renderAtom = (atom: Atom): RenderResult => {
  const renderer = new AtomRenderer();
  return renderer.render(atom);
};
