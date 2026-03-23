import type {
  Molecule, ContentAtom, DecorationAtom, AnimationAtom, InputAtom,
  Atom
} from './types';
import { AtomRenderer } from './AtomRenderer';

interface BakerState {
  id: string;
  moleculeId: string;
  isHovered: boolean;
  isClicked: boolean;
  isDragging: boolean;
  position: { x: number; y: number };
  collapsedGroups: Set<string>;
}

type StateChangeCallback = (bakerId: string, state: Partial<BakerState>) => void;

export { BakerState };

export class Beaker {
  public readonly id: string;
  public readonly molecule: Molecule;
  public readonly element: HTMLElement;
  private state: BakerState;
  private atoms: any[];
  private triggers: Set<string> = new Set();
  private atomRenderer: AtomRenderer;
  private canvasStrokesMap: Map<HTMLCanvasElement, { strokes: any[]; atom: any }> = new Map();
  private onStateChange: StateChangeCallback | null = null;

  constructor(id: string, molecule: Molecule, onStateChange?: StateChangeCallback) {
    this.id = id;
    this.molecule = molecule;
    this.atomRenderer = new AtomRenderer();
    this.onStateChange = onStateChange || null;
    
    this.element = document.createElement('div');
    this.element.id = `beaker-${molecule.id}`;
    this.element.style.position = 'absolute';
    if (molecule.position) {
      this.element.style.left = `${molecule.position.x}px`;
      this.element.style.top = `${molecule.position.y}px`;
    }
    this.element.style.overflow = 'visible';
    this.element.style.background = 'transparent';
    this.element.style.cursor = 'default';

    this.state = {
      id: this.id,
      moleculeId: molecule.id,
      isHovered: false,
      isClicked: false,
      isDragging: false,
      position: { ...(molecule.position ?? { x: 0, y: 0 }) },
      collapsedGroups: new Set()
    };

    this.atoms = [...(molecule.atoms || [])];
    this.init();
    this.attachEventListeners();
  }

  private init(): void {
    const { renderable, others } = this.decompose(this.atoms);

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

    let width: number;
    let height: number;

    if (this.molecule.width !== undefined || this.molecule.height !== undefined) {
      width = this.molecule.width ?? this.calculateContainerSize(renderable).width;
      height = this.molecule.height ?? this.calculateContainerSize(renderable).height;
    } else {
      const calculated = this.calculateContainerSize(renderable);
      width = calculated.width;
      height = calculated.height;
    }

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    this.renderDecorationAtoms(decorationAtoms);
    this.renderContentAtoms(renderable);
    this.renderResizeHandles(resizeHandleAtoms);
    this.applyAnimationStyles();
    this.setupInputHandlers(inputAtoms, animationAtoms);
  }

  private decompose(atoms: Atom[]): { renderable: ContentAtom[]; others: Atom[] } {
    const CONTENT_CAPABILITIES = ['text', 'image', 'video', 'audio', 'code', 'icon', 'canvas'];
    const renderable: ContentAtom[] = [];
    const others: Atom[] = [];

    atoms.forEach(atom => {
      if (CONTENT_CAPABILITIES.includes(atom.capability)) {
        renderable.push(atom as ContentAtom);
      } else {
        others.push(atom);
      }
    });

    return { renderable, others };
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
    const shadowAtom = atoms.find(a => a.capability === 'shadow' && !(a as any).trigger) as any;

    const moleculeRadius = (this.molecule as any).radius;
    let radius = moleculeRadius ?? backgroundAtom?.radius ?? borderAtom?.radius ?? shadowAtom?.radius ?? 0;

    if (backgroundAtom) backgroundAtom.radius = radius;
    if (borderAtom) borderAtom.radius = radius;
    if (shadowAtom) shadowAtom.radius = radius;

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

  private applyAnimationStyles(): void {
    const { id } = this.molecule;
    const isHovered = this.triggers.has(`${id}-hover`);
    const isClicked = this.state.isClicked;
    const isCurrentlyDragging = this.state.isDragging;

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

    this.atoms.forEach((atom: any) => {
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
            translateX = this.state.position.x - (this.molecule.position?.x ?? 0);
            translateY = this.state.position.y - (this.molecule.position?.y ?? 0);
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
          } else if (atom.trigger === 'click' && !isClicked && atom.collapsedValue !== undefined) {
            width = `${atom.collapsedValue}px`;
            hasWidth = true;
          }
          break;
        case 'collapse':
          const isCollapsed = this.state.collapsedGroups.has(atom.group);
          if (isCollapsed && atom.collapsedValue !== undefined) {
            height = `${atom.collapsedValue}px`;
            hasHeight = true;
          } else if (!isCollapsed && atom.expandedValue !== undefined) {
            height = `${atom.expandedValue}px`;
            hasHeight = true;
          }
          break;

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
  }

  private setupInputHandlers(inputAtoms: InputAtom[], animationAtoms: AnimationAtom[]): void {
    const hasDrag = inputAtoms.some(a => a.capability === 'drag');
    const hasClick = inputAtoms.some(a => a.capability === 'click');

    if (hasDrag) {
      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let totalDragOffsetX = 0;
      let totalDragOffsetY = 0;

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDragging = true;
        dragOffsetX = e.clientX;
        dragOffsetY = e.clientY;
        totalDragOffsetX = 0;
        totalDragOffsetY = 0;

        this.updateState({ isClicked: true });
        this.applyAnimationStyles();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - dragOffsetX;
        const dy = e.clientY - dragOffsetY;
        dragOffsetX = e.clientX;
        dragOffsetY = e.clientY;
        totalDragOffsetX += dx;
        totalDragOffsetY += dy;

        const newX = (this.molecule.position?.x ?? 0) + totalDragOffsetX;
        const newY = (this.molecule.position?.y ?? 0) + totalDragOffsetY;

        this.state.position = { x: newX, y: newY };
        this.element.style.left = `${newX}px`;
        this.element.style.top = `${newY}px`;
        this.element.style.transform = `translate(${totalDragOffsetX}px, ${totalDragOffsetY}px)`;

        this.updateState({ isDragging: true });
        this.applyAnimationStyles();
      };

      const onMouseUp = () => {
        if (isDragging) {
          const finalX = (this.molecule.position?.x ?? 0) + totalDragOffsetX;
          const finalY = (this.molecule.position?.y ?? 0) + totalDragOffsetY;
          this.molecule.position = { x: finalX, y: finalY };
          this.state.position = { x: finalX, y: finalY };
          this.element.style.transform = '';
        }

        isDragging = false;
        this.updateState({ isClicked: false, isDragging: false });
        this.applyAnimationStyles();
      };

      this.element.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    if (hasClick) {
      this.element.addEventListener('click', () => {
        this.updateState({ isClicked: !this.state.isClicked });
        this.applyAnimationStyles();
      });
    }

    const collapseAtoms = animationAtoms.filter(a => a.capability === 'collapse');
    collapseAtoms.forEach((atom: any) => {
      this.element.addEventListener('click', () => {
        const group = atom.group;
        if (this.state.collapsedGroups.has(group)) {
          this.state.collapsedGroups.delete(group);
        } else {
          this.state.collapsedGroups.add(group);
        }
        this.applyAnimationStyles();
      });
    });
  }

  private attachEventListeners(): void {
    this.element.addEventListener('mouseenter', () => {
      this.triggers.add(`${this.molecule.id}-hover`);
      this.updateState({ isHovered: true });
      this.applyAnimationStyles();
    });

    this.element.addEventListener('mouseleave', () => {
      this.triggers.delete(`${this.molecule.id}-hover`);
      this.updateState({ isHovered: false });
      this.applyAnimationStyles();
    });
  }

  private updateState(partial: Partial<BakerState>): void {
    let changed = false;
    if (partial.isHovered !== undefined && partial.isHovered !== this.state.isHovered) {
      this.state.isHovered = partial.isHovered;
      changed = true;
    }
    if (partial.isClicked !== undefined && partial.isClicked !== this.state.isClicked) {
      this.state.isClicked = partial.isClicked;
      changed = true;
    }
    if (partial.isDragging !== undefined && partial.isDragging !== this.state.isDragging) {
      this.state.isDragging = partial.isDragging;
      changed = true;
    }
    if (partial.position !== undefined) {
      this.state.position = { ...partial.position };
      changed = true;
    }

    if (changed && this.onStateChange) {
      this.onStateChange(this.id, this.state);
    }
  }

  public getState(): BakerState {
    return { ...this.state };
  }

  public updatePosition(x: number, y: number): void {
    this.state.position = { x, y };
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    if (this.onStateChange) {
      this.onStateChange(this.id, { position: { x, y } });
    }
  }
}
