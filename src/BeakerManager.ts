import type {
  Molecule, ContentAtom, DecorationAtom, AnimationAtom, InputAtom,
  DragAtom
} from './types';
import { Catalyst } from './Catalyst';
import { AtomRenderer } from './AtomRenderer';

export class BeakerManager {
  private element: HTMLElement;
  private molecule: Molecule;
  private atoms: any[] = [];
  private triggers: Set<string> = new Set();
  private clickStates: Record<string, boolean> = {};
  private isDragging: boolean = false;
  private draggingId: string | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private totalDragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private collapseStates: Record<string, boolean> = {};
  private atomRenderer: AtomRenderer;
  private shadowElement: HTMLElement | null = null;
  private staticShadowAtom: any = null;
  private hoverShadowAtom: any = null;

  constructor(molecule: Molecule) {
    this.molecule = molecule;
    this.element = document.createElement('div');
    this.atomRenderer = new AtomRenderer();

    this.atoms = [...(molecule.atoms || [])];
    this.init();
  }

  private init(): void {
    this.setupElement();
    this.decomposeAndRender();
    this.attachEventListeners();
  }

  private setupElement(): void {
    const { id, position } = this.molecule;

    this.element.id = `beaker-${id}`;
    this.element.style.position = 'absolute';
    if (position) {
      this.element.style.left = `${position.x}px`;
      this.element.style.top = `${position.y}px`;
    }
    this.element.style.overflow = 'visible';
    this.element.style.cursor = 'default';
  }

  private decomposeAndRender(): void {
    const { renderable, others } = Catalyst.decompose(this.atoms);

    const decorationAtoms = others.filter(a =>
      (a.capability === 'background' || a.capability === 'border') ||
      a.capability === 'shadow'
    ) as DecorationAtom[];

    const animationAtoms = others.filter(a =>
      a.capability === 'scale' || a.capability === 'opacity' || a.capability === 'rotate' ||
      a.capability === 'translate' || a.capability === 'height' || a.capability === 'width' ||
      a.capability === 'collapse'
    ) as AnimationAtom[];

    const inputAtoms = others.filter(a =>
      a.capability === 'drag' || a.capability === 'resize' ||
      a.capability === 'scroll' || a.capability === 'click'
    ) as InputAtom[];

    const resizeHandleAtoms = others.filter(a => a.capability === 'resize-handle');

    const userDuration = animationAtoms.find(a => a.duration !== undefined)?.duration;
    const duration = userDuration !== undefined ? userDuration : 0;
    this.element.style.transition = `width ${duration}s ease, height ${duration}s ease, transform ${duration}s ease, opacity ${duration}s ease`;

    const contentAtoms = renderable;

    let width: number;
    let height: number;

    if (this.molecule.width !== undefined || this.molecule.height !== undefined) {
      width = this.molecule.width ?? this.calculateContainerSize(contentAtoms).width;
      height = this.molecule.height ?? this.calculateContainerSize(contentAtoms).height;
    } else {
      const calculated = this.calculateContainerSize(contentAtoms);
      width = calculated.width;
      height = calculated.height;
    }

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    this.renderDecorationAtoms(decorationAtoms);
    this.renderContentAtoms(contentAtoms);
    this.renderResizeHandles(resizeHandleAtoms);
    this.applyAnimationStyles(animationAtoms);
    this.setupInputHandlers(inputAtoms, animationAtoms);
    this.setupResizeHandlers(resizeHandleAtoms as any);
  }

  private calculateContainerSize(atoms: ContentAtom[]): { width: number; height: number } {
    let maxX = 0;
    let maxY = 0;

    atoms.forEach(atom => {
      const x = atom.position?.x ?? 0;
      const y = atom.position?.y ?? 0;

      let atomWidth = 0;
      let atomHeight = 0;

      switch (atom.capability) {
        case 'text': {
          const fontSize = atom.size || 16;
          const text = atom.text || '';
          let charWidth = 0;
          for (const char of text) {
            charWidth += /[a-zA-Z0-9]/.test(char) ? fontSize * 0.6 : fontSize;
          }
          atomWidth = charWidth + 20;
          atomHeight = fontSize + 10;
          break;
        }
        case 'image':
          atomWidth = atom.width || 100;
          atomHeight = atom.height || 100;
          break;
        case 'video':
          atomWidth = atom.width || 300;
          atomHeight = atom.height || 200;
          break;
        case 'audio':
          atomWidth = 200;
          atomHeight = 40;
          break;
        case 'code':
          atomWidth = 300;
          atomHeight = 150;
          break;
        case 'icon':
          atomWidth = atom.size || 24;
          atomHeight = atom.size || 24;
          break;
        case 'canvas':
          atomWidth = (atom as any).width || 100;
          atomHeight = (atom as any).height || 100;
          break;
      }

      maxX = Math.max(maxX, x + atomWidth);
      maxY = Math.max(maxY, y + atomHeight);
    });

    const padding = 20;
    return {
      width: Math.max(maxX + padding, 50),
      height: Math.max(maxY + padding, 30)
    };
  }

  private renderDecorationAtoms(atoms: DecorationAtom[]): void {
    const backgroundAtom = atoms.find(a => a.capability === 'background') as any;
    const borderAtom = atoms.find(a => a.capability === 'border') as any;

    let radius = 0;
    if (backgroundAtom && borderAtom) {
      if (backgroundAtom.radius !== undefined && borderAtom.radius === undefined) {
        borderAtom.radius = backgroundAtom.radius;
      } else if (backgroundAtom.radius === undefined && borderAtom.radius !== undefined) {
        backgroundAtom.radius = borderAtom.radius;
      }
    } else if (backgroundAtom) {
      backgroundAtom.radius = backgroundAtom.radius ?? 0;
      radius = backgroundAtom.radius;
    } else if (borderAtom) {
      borderAtom.radius = borderAtom.radius ?? 0;
      radius = borderAtom.radius;
    }

    if (backgroundAtom?.radius !== undefined || borderAtom?.radius !== undefined) {
      radius = backgroundAtom?.radius ?? borderAtom?.radius ?? 0;
    }

    atoms.forEach(atom => {
      const shadowAtom = atom as any;
      if (shadowAtom.capability === 'shadow') {
        if (shadowAtom.trigger) {
          this.hoverShadowAtom = shadowAtom;
          return;
        } else {
          this.staticShadowAtom = shadowAtom;
          shadowAtom.radius = radius;
        }
      }

      const result = this.atomRenderer.render(atom);
      if (!result.success) {
        console.error(`Failed to render atom ${result.id}: ${result.error}`);
      }
      if (result.element) {
        if (atom.capability === 'shadow' && !(atom as any).trigger) {
          this.shadowElement = result.element;
        }
        this.element.appendChild(result.element);
      }
    });
  }

  private renderContentAtoms(atoms: ContentAtom[]): void {
    atoms.forEach(atom => {
      const result = this.atomRenderer.render(atom);
      if (!result.success) {
        console.error(`Failed to render atom ${result.id}: ${result.error}`);
      }
      if (result.element) {
        if (atom.capability === 'canvas') {
          this.setupCanvasDrawing(result.element, atom as any);
        }
        this.element.appendChild(result.element);
      }
    });
  }

  private renderResizeHandles(atoms: any[]): void {
    atoms.forEach(atom => {
      const result = this.atomRenderer.render(atom);
      if (!result.success) {
        console.error(`Failed to render atom ${result.id}: ${result.error}`);
      }
      if (result.element) {
        this.element.appendChild(result.element);
      }
    });
  }

  private canvasStrokesMap: Map<HTMLCanvasElement, { strokes: any[]; atom: any }> = new Map();

  private setupCanvasDrawing(container: HTMLElement, atom: any): void {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const strokes: any[] = [];
    let currentStroke: any = null;
    let currentColor = atom.blackboardStyle ? [200, 220, 200] : (atom.strokeColor || [0, 0, 0]);
    let currentWidth = atom.strokeWidth || 2;
    let isEraser = false;

    (canvas as any).strokes = strokes;
    this.canvasStrokesMap.set(canvas, { strokes, atom });

    const updateCtxStyle = () => {
      if (isEraser) {
        ctx.strokeStyle = atom.blackboardStyle ? '#2d5a2d' : '#ffffff';
        ctx.lineWidth = currentWidth * 3;
      } else {
        ctx.strokeStyle = `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`;
        ctx.lineWidth = currentWidth;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    updateCtxStyle();

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const getCanvasPosition = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const drawStroke = (stroke: any) => {
      if (stroke.points.length < 2) return;

      if (stroke.isEraser) {
        ctx.strokeStyle = atom.blackboardStyle ? '#2d5a2d' : '#ffffff';
        ctx.lineWidth = stroke.width * 3;
      } else {
        ctx.strokeStyle = `rgb(${stroke.color[0]}, ${stroke.color[1]}, ${stroke.color[2]})`;
        ctx.lineWidth = stroke.width;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    };

    const redrawAllStrokes = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      }
      strokes.forEach(drawStroke);
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const pos = getCanvasPosition(e);
      lastX = pos.x;
      lastY = pos.y;

      currentStroke = {
        points: [{ x: lastX, y: lastY }],
        color: [...currentColor],
        width: currentWidth,
        isEraser
      };
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getCanvasPosition(e);

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      currentStroke.points.push({ x: pos.x, y: pos.y });
      lastX = pos.x;
      lastY = pos.y;
    };

    const stopDrawing = () => {
      if (currentStroke && currentStroke.points.length > 0) {
        strokes.push(currentStroke);
        currentStroke = null;
      }
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });
    canvas.addEventListener('touchend', stopDrawing);

    const toolbar = container.querySelector('div:last-child');
    if (!toolbar) return;

    const colorBtns = toolbar.querySelectorAll('button[data-color]');
    colorBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        currentColor = JSON.parse((btn as HTMLElement).dataset.color || '[0,0,0]');
        isEraser = false;
        updateCtxStyle();
        colorBtns.forEach((b, i) => (b as HTMLElement).style.border = i === idx ? '2px solid #333' : '1px solid #ccc');
        (toolbar.querySelector('button[title="橡皮擦"]') as HTMLElement).style.background = '#fff';
      });
    });

    const widthBtns = toolbar.querySelectorAll('button[data-width]');
    widthBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        currentWidth = parseInt((btn as HTMLElement).dataset.width || '2', 10);
        updateCtxStyle();
        widthBtns.forEach((b, i) => (b as HTMLElement).style.border = i === idx ? '2px solid #333' : '1px solid #ccc');
      });
    });

    const eraserBtn = toolbar.querySelector('button[title="橡皮擦"]') as HTMLElement;
    if (eraserBtn) {
      eraserBtn.addEventListener('click', () => {
        isEraser = !isEraser;
        updateCtxStyle();
        eraserBtn.style.background = isEraser
          ? (atom.blackboardStyle ? 'rgba(80, 120, 80, 0.9)' : '#e0e0e0')
          : (atom.blackboardStyle ? 'rgba(30, 60, 30, 0.8)' : 'rgba(255,255,255,0.9)');
        eraserBtn.style.boxShadow = isEraser
          ? '0 1px 3px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.3)'
          : (atom.blackboardStyle ? '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)' : '0 1px 3px rgba(0,0,0,0.1)');
      });
    }

    const clearBtn = toolbar.querySelector('button[title="清除全部"]') as HTMLElement;
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        strokes.length = 0;
        redrawAllStrokes();
      });
    }
  }

  private applyAnimationStyles(atoms: AnimationAtom[]): void {
    const { id } = this.molecule;
    const isHovered = this.triggers.has(`${id}-hover`);
    const isClicked = this.clickStates[id] === true;
    const isCurrentlyDragging = this.isDragging && this.draggingId === id;

    let scale = 1;
    let opacity = 1;
    let rotate = 0;
    let translateX = 0;
    let translateY = 0;
    let height = 'auto';
    let width = 'auto';
    let hasScale = false;
    let hasOpacity = false;
    let hasRotate = false;
    let hasTranslate = false;
    let hasHeight = false;
    let hasWidth = false;
    let hoverShadowX = 0;
    let hoverShadowY = 0;
    let hoverShadowBlur = 0;
    let hasHoverShadow = false;

    (atoms as any[]).forEach((atom: any) => {
      switch (atom.capability) {
        case 'scale':
          if (atom.trigger === 'hover' && isHovered) {
            scale = atom.value;
            hasScale = true;
          } else if (atom.trigger === 'hover' && !isHovered) {
            scale = 1;
            hasScale = true;
          } else if (atom.trigger === 'click' && isClicked) {
            scale = atom.value;
            hasScale = true;
          } else if (atom.trigger === 'click' && !isClicked) {
            scale = 1;
            hasScale = true;
          } else if (atom.trigger === 'drag' && isCurrentlyDragging) {
            scale = atom.value;
            hasScale = true;
          }
          break;
        case 'opacity':
          if (atom.trigger === 'hover' && isHovered) {
            opacity = atom.value;
            hasOpacity = true;
          } else if (atom.trigger === 'hover' && !isHovered) {
            opacity = 1;
            hasOpacity = true;
          } else if (atom.trigger === 'click' && isClicked) {
            opacity = atom.value;
            hasOpacity = true;
          } else if (atom.trigger === 'click' && !isClicked) {
            opacity = 1;
            hasOpacity = true;
          } else if (atom.trigger === 'drag' && isCurrentlyDragging) {
            opacity = atom.value;
            hasOpacity = true;
          }
          break;
        case 'rotate':
          if (atom.trigger === 'hover' && isHovered) {
            rotate = atom.value;
            hasRotate = true;
          } else if (atom.trigger === 'hover' && !isHovered) {
            rotate = 0;
            hasRotate = true;
          } else if (atom.trigger === 'click' && isClicked) {
            rotate = atom.value;
            hasRotate = true;
          } else if (atom.trigger === 'click' && !isClicked) {
            rotate = 0;
            hasRotate = true;
          }
          break;
        case 'translate':
          if (isCurrentlyDragging) {
            translateX = this.dragOffset.x;
            translateY = this.dragOffset.y;
            hasTranslate = true;
          }
          break;
        case 'height':
          if (atom.trigger === 'hover' && isHovered) {
            height = `${atom.value}px`;
            hasHeight = true;
          } else if (atom.trigger === 'click' && isClicked) {
            height = `${atom.value}px`;
            hasHeight = true;
          } else if (atom.trigger === 'click' && !isClicked && atom.collapsedValue !== undefined) {
            height = `${atom.collapsedValue}px`;
            hasHeight = true;
          }
          break;
        case 'width':
          if (atom.trigger === 'hover' && isHovered) {
            width = `${atom.value}px`;
            hasWidth = true;
          } else if (atom.trigger === 'click' && isClicked) {
            width = `${atom.value}px`;
            hasWidth = true;
          } else if (atom.trigger === 'click' && !isClicked && (atom as any).collapsedValue !== undefined) {
            width = `${(atom as any).collapsedValue}px`;
            hasWidth = true;
          }
          break;
        case 'collapse':
          const isCollapsed = this.collapseStates[atom.group] ?? false;
          if (isCollapsed && atom.collapsedValue !== undefined) {
            height = `${atom.collapsedValue}px`;
            hasHeight = true;
          } else if (!isCollapsed && atom.expandedValue !== undefined) {
            height = `${atom.expandedValue}px`;
            hasHeight = true;
          }
          break;
      }

      if (this.hoverShadowAtom && this.hoverShadowAtom.trigger === 'hover' && isHovered) {
        hasHoverShadow = true;
        hoverShadowX = this.hoverShadowAtom.x;
        hoverShadowY = this.hoverShadowAtom.y;
        hoverShadowBlur = this.hoverShadowAtom.blur;
      }
    });

    const transforms: string[] = [];
    if (hasScale) transforms.push(`scale(${scale})`);
    if (hasRotate) transforms.push(`rotate(${rotate}deg)`);
    if (hasTranslate) transforms.push(`translate(${translateX}px, ${translateY}px)`);

    if (transforms.length > 0) {
      this.element.style.transform = transforms.join(' ');
    }

    if (hasOpacity) {
      this.element.style.opacity = opacity.toString();
    }

    if (hasHeight) {
      this.element.style.height = height;
    }

    if (hasWidth) {
      this.element.style.width = width;
    }

    if (this.shadowElement) {
      if (hasHoverShadow && this.hoverShadowAtom) {
        const color = this.hoverShadowAtom.color;
        this.shadowElement.style.boxShadow = `${hoverShadowX}px ${hoverShadowY}px ${hoverShadowBlur}px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.25)`;
      } else if (this.staticShadowAtom) {
        const color = this.staticShadowAtom.color;
        this.shadowElement.style.boxShadow = `${this.staticShadowAtom.x}px ${this.staticShadowAtom.y}px ${this.staticShadowAtom.blur}px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.25)`;
      }
    }
  }

  private setupInputHandlers(inputAtoms: InputAtom[], animationAtoms: AnimationAtom[]): void {
    const { id } = this.molecule;
    const dragAtom = inputAtoms.find(a => a.capability === 'drag') as DragAtom | undefined;
    const hasDrag = dragAtom !== undefined;
    const hasClickTrigger = animationAtoms.some(a =>
      (a.capability === 'scale' || a.capability === 'rotate' ||
        a.capability === 'height' || a.capability === 'width') &&
      (a as any).trigger === 'click'
    );
    const hasClickInput = inputAtoms.some(a => a.capability === 'click');
    const hasClick = hasClickTrigger || hasClickInput;
    const hasHoverTrigger = animationAtoms.some(a =>
      (a.capability === 'scale' || a.capability === 'opacity' ||
        a.capability === 'rotate' || a.capability === 'height' ||
        a.capability === 'width') &&
      (a as any).trigger === 'hover'
    );

    if (hasHoverTrigger) {
      this.element.addEventListener('mouseenter', () => this.trigger(`${id}-hover`));
      this.element.addEventListener('mouseleave', () => this.untrigger(`${id}-hover`));
    }

    if (hasClick) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clickStates[id] = !this.clickStates[id];
        this.updateAnimation();
      });
    }

    if (hasDrag) {
      this.element.style.cursor = 'move';
      this.element.addEventListener('mousedown', (e) => this.startDrag(e, id, dragAtom!.spring));
    }
  }

  private attachEventListeners(): void {
    this.element.addEventListener('mouseenter', () => this.updateAnimation());
    this.element.addEventListener('mouseleave', () => this.updateAnimation());
  }

  private trigger(tid: string): void {
    this.triggers.add(tid);
    this.updateAnimation();
  }

  private untrigger(tid: string): void {
    this.triggers.delete(tid);
    this.updateAnimation();
  }

  private updateAnimation(): void {
    const { others } = Catalyst.decompose(this.atoms);
    const animationAtoms = others.filter(a =>
      a.capability === 'scale' || a.capability === 'opacity' || a.capability === 'rotate' ||
      a.capability === 'translate' || a.capability === 'height' || a.capability === 'width' ||
      a.capability === 'collapse'
    ) as AnimationAtom[];

    this.applyAnimationStyles(animationAtoms);
  }

  private startDrag(e: MouseEvent, id: string, spring?: boolean): void {
    e.preventDefault();
    this.isDragging = true;
    this.draggingId = id;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - e.clientX + this.totalDragOffset.x;
      const dy = moveEvent.clientY - e.clientY + this.totalDragOffset.y;
      this.dragOffset = { x: dx, y: dy };
      this.updateAnimation();
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      this.isDragging = false;
      this.draggingId = null;
      if (spring !== false) {
        this.dragOffset = { x: 0, y: 0 };
        this.totalDragOffset = { x: 0, y: 0 };
      } else {
        this.totalDragOffset = { ...this.dragOffset };
      }
      this.updateAnimation();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private setupResizeHandlers(atoms: any[]): void {
    if (atoms.length === 0) return;

    const resizeHandle = this.element.querySelector('[data-resize-handle]') as HTMLElement;
    if (!resizeHandle) return;

    const handleAtom = atoms[0];
    const minWidth = handleAtom.minWidth ?? 100;
    const minHeight = handleAtom.minHeight ?? 80;
    const scaleMode = handleAtom.scaleMode ?? 'proportional';

    let isResizing = false;
    let savedDragOffset: { x: number; y: number } = { x: 0, y: 0 };
    let initialWidth = 0;
    let initialHeight = 0;
    let originalValues: any[] = [];

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;

      savedDragOffset = { ...this.dragOffset };
      this.dragOffset = { x: 0, y: 0 };
      this.updateAnimation();

      initialWidth = this.element.offsetWidth;
      initialHeight = this.element.offsetHeight;

      if (scaleMode !== 'container') {
        const { renderable } = Catalyst.decompose(this.atoms);
        originalValues = renderable.map((atom: any) => ({
          x: atom.position?.x ?? 0,
          y: atom.position?.y ?? 0,
          width: atom.width,
          height: atom.height,
          size: atom.size,
          z: atom.position?.z
        }));
      }

      document.body.style.cursor = 'nwse-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const rect = this.element.getBoundingClientRect();
      const newWidth = Math.max(minWidth, e.clientX - rect.left);
      const newHeight = Math.max(minHeight, e.clientY - rect.top);

      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
    });

    document.addEventListener('mouseup', () => {
      if (!isResizing) return;

      if (scaleMode !== 'container' && originalValues.length > 0) {
        const newWidth = parseFloat(this.element.style.width);
        const newHeight = parseFloat(this.element.style.height);
        const ratioX = newWidth / initialWidth;
        const ratioY = newHeight / initialHeight;

        const { renderable } = Catalyst.decompose(this.atoms);
        renderable.forEach((atom: any, index: number) => {
          const original = originalValues[index];
          if (!original) return;

          if (atom.position) {
            atom.position = {
              x: original.x * ratioX,
              y: original.y * ratioY,
              z: original.z
            };
          }
          if (atom.width !== undefined) atom.width = original.width * ratioX;
          if (atom.height !== undefined) atom.height = original.height * ratioY;
          if (atom.size !== undefined) atom.size = original.size * Math.min(ratioX, ratioY);
        });

        this.rerenderContentAtoms();
      }

      isResizing = false;
      document.body.style.cursor = '';

      this.dragOffset = savedDragOffset;
      this.totalDragOffset = { ...savedDragOffset };
      this.updateAnimation();
    });
  }

  private rerenderContentAtoms(): void {
    const existingContent = this.element.querySelectorAll('.content-atom');
    existingContent.forEach(el => el.remove());

    const { renderable } = Catalyst.decompose(this.atoms);
    renderable.forEach((atom: ContentAtom) => {
      const result = this.atomRenderer.render(atom);
      if (!result.success) {
        console.error(`Failed to render atom ${result.id}: ${result.error}`);
      }
      if (result.element) {
        result.element.classList.add('content-atom');
        this.element.appendChild(result.element);

        if (atom.capability === 'canvas') {
          this.setupCanvasDrawing(result.element, atom as any);
        }
      }
    });
  }

  public getMolecule(): Molecule {
    return this.molecule;
  }
}
