import type { Molecule } from './molecules';
import * as Atoms from './atoms/index';

interface BakerState {
  id: string;
  moleculeId: string;
  isHovered: boolean;
  isClicked: boolean;
  isDragging: boolean;
  isResizing: boolean;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  scrollX?: number;
  scrollY?: number;
  collapsedGroups: Set<string>;
}

type StateChangeCallback = (bakerId: string, state: Partial<BakerState>) => void;

export { BakerState };

export class Beaker {
  public readonly id: string;
  public readonly molecule: Molecule;
  public readonly element: HTMLElement;
  public state: BakerState;
  private triggers: Set<string> = new Set();
  private onStateChange: StateChangeCallback | null = null;
  private contentAtoms: any[] = [];
  private eventAtoms: any[] = [];
  private resizeHandles: any[] = [];
  public readonly bakerIndex: number;
  private atomIndexCounter: number = 0;

  constructor(id: string, molecule: Molecule, bakerIndex: number, onStateChange?: StateChangeCallback) {
    this.id = id;
    this.bakerIndex = bakerIndex;
    this.molecule = molecule;
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
    this.element.style.border = 'transparent';
    this.element.style.outline = 'transparent';
    this.element.style.boxShadow = 'transparent';
    this.element.style.cursor = 'default';

    this.state = {
      id: this.id,
      moleculeId: molecule.id,
      isHovered: false,
      isClicked: false,
      isDragging: false,
      isResizing: false,
      position: { ...(molecule.position ?? { x: 0, y: 0 }) },
      width: undefined,
      height: undefined,
      scrollX: 0,
      scrollY: 0,
      collapsedGroups: new Set()
    };

    this.init();
  }

  private init(): void {
    const atoms = [...(this.molecule.atoms || [])];

    const contentCapabilities = ['text', 'image', 'video', 'audio', 'code', 'icon', 'canvas'];
    const eventCapabilities = ['drag', 'resize', 'scroll', 'click', 'hover'];
    const resizeHandleCapabilities = ['resize-handle'];
    const decorationCapabilities = ['background', 'border', 'shadow'];
    const animationCapabilities = ['scale', 'opacity', 'rotate', 'translate', 'height', 'width', 'collapse'];

    const contentAtoms = atoms.filter(a => contentCapabilities.includes(a.capability));
    const eventAtomConfigs = atoms.filter(a => eventCapabilities.includes(a.capability));
    const resizeHandleConfigs = atoms.filter(a => resizeHandleCapabilities.includes(a.capability));
    const decorationAtoms = atoms.filter(a => decorationCapabilities.includes(a.capability)) as any[];
    const animationAtoms = atoms.filter(a => animationCapabilities.includes(a.capability)) as any[];

    const userDuration = animationAtoms.find(a => a.duration !== undefined)?.duration;
    const duration = userDuration !== undefined ? userDuration : 0;
    this.element.style.transition = `width ${duration}s ease, height ${duration}s ease, transform ${duration}s ease, opacity ${duration}s ease`;

    const calculatedSize = this.calculateContainerSize(contentAtoms);
    let width = this.molecule.width ?? calculatedSize.width;
    let height = this.molecule.height ?? calculatedSize.height;

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.state.width = width;
    this.state.height = height;

    this.createDecorationAtoms(decorationAtoms, this.molecule.width, this.molecule.height);
    this.createContentAtoms(contentAtoms);
    this.createEventAtoms(eventAtomConfigs, animationAtoms);
    this.createResizeHandles(resizeHandleConfigs);
  }

  private createContext(): { bakerId: string; bakerIndex: number; atomIndex: number } {
    return {
      bakerId: this.id,
      bakerIndex: this.bakerIndex,
      atomIndex: this.atomIndexCounter++
    };
  }

  private calculateContainerSize(atoms: any[]): { width: number; height: number } {
    let maxX = 0;
    let maxY = 0;

    atoms.forEach(atom => {
      const x = atom.position?.x ?? 0;
      const y = atom.position?.y ?? 0;

      let atomWidth = 0;
      let atomHeight = 0;

      switch (atom.capability) {
        case 'text':
          atomWidth = (atom.text?.length ?? 0) * (atom.size ?? 16) * 0.6 + 20;
          atomHeight = (atom.size ?? 16) + 10;
          break;
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
          atomWidth = atom.width || 100;
          atomHeight = atom.height || 100;
          break;
      }

      maxX = Math.max(maxX, x + atomWidth);
      maxY = Math.max(maxY, y + atomHeight);
    });

    const padding = 0;
    return {
      width: Math.max(maxX + padding, 50),
      height: Math.max(maxY + padding, 30)
    };
  }

  private createDecorationAtoms(atoms: any[], moleculeWidth?: number, moleculeHeight?: number): void {
    const moleculeRadius = (this.molecule as any).radius ?? 12;
    atoms.forEach(config => {
      const context = this.createContext();
      try {
        switch (config.capability) {
          case 'background':
            new Atoms.BackgroundAtom(context, this.element, {
              color: config.color,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
          case 'border':
            new Atoms.BorderAtom(context, this.element, {
              borderWidth: config.width ?? 1,
              color: config.color,
              position: config.position,
              boxWidth: config.width ?? moleculeWidth,
              boxHeight: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
          case 'shadow':
            new Atoms.ShadowAtom(context, this.element, {
              x: config.x,
              y: config.y,
              blur: config.blur,
              color: config.color,
              spread: config.spread,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
        }
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建装饰原子失败:`, error);
      }
    });
  }

  private createContentAtoms(atoms: any[]): void {
    atoms.forEach(atomConfig => {
      const context = this.createContext();

      try {
        switch (atomConfig.capability) {
          case 'text':
            this.contentAtoms.push(new Atoms.TextAtom(context, this.element, {
              text: atomConfig.text,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position
            }));
            break;
          case 'image':
            this.contentAtoms.push(new Atoms.ImageAtom(context, this.element, {
              src: atomConfig.src,
              width: atomConfig.width,
              height: atomConfig.height,
              alt: atomConfig.alt,
              position: atomConfig.position
            }));
            break;
          case 'video':
            this.contentAtoms.push(new Atoms.VideoAtom(context, this.element, {
              src: atomConfig.src,
              width: atomConfig.width,
              height: atomConfig.height,
              position: atomConfig.position
            }));
            break;
          case 'audio':
            this.contentAtoms.push(new Atoms.AudioAtom(context, this.element, {
              src: atomConfig.src,
              position: atomConfig.position
            }));
            break;
          case 'code':
            this.contentAtoms.push(new Atoms.CodeAtom(context, this.element, {
              code: atomConfig.code,
              language: atomConfig.language,
              position: atomConfig.position,
              width: atomConfig.width,
              height: atomConfig.height,
              backgroundColor: atomConfig.backgroundColor,
              autoFormat: atomConfig.autoFormat
            }));
            break;
          case 'icon':
            this.contentAtoms.push(new Atoms.IconAtom(context, this.element, {
              icon: atomConfig.icon,
              size: atomConfig.size,
              position: atomConfig.position
            }));
            break;
          case 'canvas':
            this.contentAtoms.push(new Atoms.CanvasAtom(context, this.element, {
              width: atomConfig.width,
              height: atomConfig.height,
              position: atomConfig.position,
              strokeColor: atomConfig.strokeColor,
              strokeWidth: atomConfig.strokeWidth,
              backgroundColor: atomConfig.backgroundColor,
              blackboardStyle: atomConfig.blackboardStyle,
              defaultWidths: atomConfig.defaultWidths,
              showToolbar: atomConfig.showToolbar,
              resizable: atomConfig.resizable,
              minWidth: atomConfig.minWidth,
              minHeight: atomConfig.minHeight
            }));
            break;
        }
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ContentAtom失败:`, error);
      }
    });
  }

  private createEventAtoms(eventConfigs: any[], animationAtoms: any[]): void {
    const clickConfig = eventConfigs.find(a => a.capability === 'click');
    if (clickConfig) {
      const context = this.createContext();
      try {
        const atom = new Atoms.ClickAtom(context, this, {
          onClick: () => {
            this.state.isClicked = !this.state.isClicked;
            this.applyAnimations(animationAtoms);
          },
          onDoubleClick: clickConfig.onDoubleClick
        });
        this.eventAtoms.push(atom);
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ClickAtom失败:`, error);
      }
    }

    const dragConfig = eventConfigs.find(a => a.capability === 'drag');
    if (dragConfig) {
      const context = this.createContext();
      try {
        const atom = new Atoms.DragAtom(context, this, {
          handle: dragConfig.handle,
          bounds: dragConfig.bounds,
          onDragStart: dragConfig.onDragStart,
          onDragMove: (pos) => {
            this.element.style.left = `${pos.x}px`;
            this.element.style.top = `${pos.y}px`;
            dragConfig.onDragMove?.(pos);
          },
          onDragEnd: dragConfig.onDragEnd
        });
        this.eventAtoms.push(atom);
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建DragAtom失败:`, error);
      }
    }

    const resizeConfig = eventConfigs.find(a => a.capability === 'resize');
    if (resizeConfig) {
      const context = this.createContext();
      try {
        const atom = new Atoms.ResizeAtom(context, this, {
          minWidth: resizeConfig.minWidth,
          minHeight: resizeConfig.minHeight,
          maxWidth: resizeConfig.maxWidth,
          maxHeight: resizeConfig.maxHeight,
          onResizeStart: resizeConfig.onResizeStart,
          onResize: (size) => {
            this.element.style.width = `${size.width}px`;
            this.element.style.height = `${size.height}px`;
            resizeConfig.onResize?.(size);
          },
          onResizeEnd: resizeConfig.onResizeEnd
        });
        this.eventAtoms.push(atom);
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ResizeAtom失败:`, error);
      }
    }

    const scrollConfig = eventConfigs.find(a => a.capability === 'scroll');
    if (scrollConfig) {
      const context = this.createContext();
      try {
        const atom = new Atoms.ScrollAtom(context, this, {
          direction: scrollConfig.direction,
          scrollX: scrollConfig.scrollX,
          scrollY: scrollConfig.scrollY,
          maxScrollX: scrollConfig.maxScrollX,
          maxScrollY: scrollConfig.maxScrollY,
          onScroll: scrollConfig.onScroll
        });
        this.eventAtoms.push(atom);
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ScrollAtom失败:`, error);
      }
    }

    const hoverConfig = eventConfigs.find(a => a.capability === 'hover');
    if (hoverConfig) {
      const context = this.createContext();
      try {
        const atom = new Atoms.HoverAtom(context, this, {
          onMouseEnter: () => {
            this.triggers.add(`${this.molecule.id}-hover`);
            this.state.isHovered = true;
            this.applyAnimations(animationAtoms);
          },
          onMouseLeave: () => {
            this.triggers.delete(`${this.molecule.id}-hover`);
            this.state.isHovered = false;
            this.applyAnimations(animationAtoms);
          }
        });
        this.eventAtoms.push(atom);
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建HoverAtom失败:`, error);
      }
    }

    const collapseAtoms = animationAtoms.filter(a => a.capability === 'collapse');
    collapseAtoms.forEach((atom: any) => {
      this.element.addEventListener('click', () => {
        if (this.state.collapsedGroups.has(atom.group)) {
          this.state.collapsedGroups.delete(atom.group);
        } else {
          this.state.collapsedGroups.add(atom.group);
        }
        this.applyAnimations(animationAtoms);
      });
    });
  }

  private createResizeHandles(configs: any[]): void {
    configs.forEach(config => {
      const context = this.createContext();
      try {
        const handle = new Atoms.ResizeHandleAtom(context, this, {
          edge: config.edge,
          minWidth: config.minWidth,
          minHeight: config.minHeight,
          handleSize: config.handleSize,
          handleColor: config.handleColor,
          scaleMode: config.scaleMode
        });
        this.resizeHandles.push(handle);
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ResizeHandleAtom失败:`, error);
      }
    });
  }

  private applyAnimations(animationAtoms: any[]): void {
    const isHovered = this.triggers.has(`${this.molecule.id}-hover`);
    const isClicked = this.state.isClicked;
    const isDragging = this.state.isDragging;

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

    animationAtoms.forEach((atom: any) => {
      switch (atom.capability) {
        case 'scale':
          if ((atom.trigger === 'hover' && isHovered) || (atom.trigger === 'click' && isClicked)) {
            scale = atom.value;
            hasScale = true;
          } else if (atom.trigger === 'hover' || atom.trigger === 'click') {
            scale = 1;
            hasScale = true;
          }
          break;
        case 'opacity':
          if ((atom.trigger === 'hover' && isHovered) || (atom.trigger === 'click' && isClicked)) {
            opacity = atom.value;
            hasOpacity = true;
          } else if (atom.trigger === 'hover' || atom.trigger === 'click') {
            opacity = 1;
            hasOpacity = true;
          }
          break;
        case 'rotate':
          if ((atom.trigger === 'hover' && isHovered) || (atom.trigger === 'click' && isClicked)) {
            rotate = atom.value;
            hasRotate = true;
          } else if (atom.trigger === 'hover' || atom.trigger === 'click') {
            rotate = 0;
            hasRotate = true;
          }
          break;
        case 'translate':
          if (atom.trigger === 'drag' && isDragging) {
            translateX = this.state.position.x - (this.molecule.position?.x ?? 0);
            translateY = this.state.position.y - (this.molecule.position?.y ?? 0);
            hasTranslate = true;
          }
          break;
        case 'height':
          if ((atom.trigger === 'hover' && isHovered) || (atom.trigger === 'click' && isClicked)) {
            height = `${atom.value}px`;
            hasHeight = true;
          } else if (atom.trigger === 'click' && !isClicked && atom.collapsedValue !== undefined) {
            height = `${atom.collapsedValue}px`;
            hasHeight = true;
          }
          break;
        case 'width':
          if ((atom.trigger === 'hover' && isHovered) || (atom.trigger === 'click' && isClicked)) {
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

  public updateState(newState: Partial<BakerState>): void {
    this.state = { ...this.state, ...newState };
    if (this.onStateChange) {
      this.onStateChange(this.id, newState);
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
