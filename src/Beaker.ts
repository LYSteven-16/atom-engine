import type { Molecule } from './molecules';
import * as Atoms from './atoms/index';
import type { ScaleAtom } from './atoms/ScaleAtom';
import type { OpacityAtom } from './atoms/OpacityAtom';
import type { RotateAtom } from './atoms/RotateAtom';
import type { TranslateAtom } from './atoms/TranslateAtom';
import type { HeightAtom } from './atoms/HeightAtom';
import type { WidthAtom } from './atoms/WidthAtom';
import type { CollapseAtom } from './atoms/CollapseAtom';

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
  public readonly bakerIndex: number;

  private onStateChange: StateChangeCallback | null = null;
  private contentAtoms: any[] = [];
  private atomIndexCounter: number = 0;
  private decorationAtoms: {
    background?: Atoms.BackgroundAtom;
    border?: Atoms.BorderAtom;
    shadow?: Atoms.ShadowAtom;
  } = {};

  private animationAtoms: {
    scale?: ScaleAtom;
    opacity?: OpacityAtom;
    rotate?: RotateAtom;
    translate?: TranslateAtom;
    height?: HeightAtom;
    width?: WidthAtom;
    collapse?: CollapseAtom[];
  } = {};

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
    this.element.style.borderRadius = `${(molecule as any).radius ?? 12}px`;

    this.state = this.createInitialState(molecule);

    this.init();
  }

  private createInitialState(molecule: Molecule): BakerState {
    return {
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
  }

  private init(): void {
    const atoms = [...(this.molecule.atoms || [])];

    const contentCapabilities = ['text', 'image', 'video', 'audio', 'code', 'icon', 'canvas'];
    const decorationCapabilities = ['background', 'border', 'shadow'];
    const animationCapabilities = ['scale', 'opacity', 'rotate', 'translate', 'height', 'width', 'collapse'];

    const contentAtoms = atoms.filter(a => contentCapabilities.includes(a.capability));
    const decorationAtoms = atoms.filter(a => decorationCapabilities.includes(a.capability)) as any[];
    const animationAtomConfigs = atoms.filter(a => animationCapabilities.includes(a.capability)) as any[];

    const userDuration = animationAtomConfigs.find(a => a.duration !== undefined)?.duration;
    const duration = userDuration !== undefined ? userDuration : 0;
    this.element.style.transition = `width ${duration}s ease, height ${duration}s ease, transform ${duration}s ease, opacity ${duration}s ease`;

    const calculatedSize = this.calculateContainerSize(contentAtoms);
    let width = this.molecule.width ?? calculatedSize.width;
    let height = this.molecule.height ?? calculatedSize.height;

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.state.width = width;
    this.state.height = height;

    this.createDecorationAtoms(decorationAtoms, width, height);
    this.createContentAtoms(contentAtoms);
    this.createAnimationAtoms(animationAtomConfigs);
    this.createInputAtoms(atoms);
    this.createResizeHandles(atoms.filter(a => a.capability === 'resize-handle'));
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
            this.decorationAtoms.background = new Atoms.BackgroundAtom(context, this.element, {
              id: config.id,
              color: config.color,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
          case 'border':
            this.decorationAtoms.border = new Atoms.BorderAtom(context, this.element, {
              id: config.id,
              borderWidth: config.borderWidth,
              color: config.color,
              position: config.position,
              width: config.width ?? moleculeWidth,
              height: config.height ?? moleculeHeight,
              radius: config.radius ?? moleculeRadius
            });
            break;
          case 'shadow':
            this.decorationAtoms.shadow = new Atoms.ShadowAtom(context, this.element, {
              id: config.id,
              x: config.x,
              y: config.y,
              shadowBlur: config.shadowBlur,
              color: config.color,
              shadowWidth: config.shadowWidth,
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
              id: atomConfig.id,
              text: atomConfig.text,
              size: atomConfig.size,
              color: atomConfig.color,
              position: atomConfig.position
            }));
            break;
          case 'image':
            this.contentAtoms.push(new Atoms.ImageAtom(context, this.element, {
              id: atomConfig.id,
              src: atomConfig.src,
              width: atomConfig.width,
              height: atomConfig.height,
              alt: atomConfig.alt,
              position: atomConfig.position
            }));
            break;
          case 'video':
            this.contentAtoms.push(new Atoms.VideoAtom(context, this.element, {
              id: atomConfig.id,
              src: atomConfig.src,
              width: atomConfig.width,
              height: atomConfig.height,
              position: atomConfig.position
            }));
            break;
          case 'audio':
            this.contentAtoms.push(new Atoms.AudioAtom(context, this.element, {
              id: atomConfig.id,
              src: atomConfig.src,
              position: atomConfig.position
            }));
            break;
          case 'code':
            this.contentAtoms.push(new Atoms.CodeAtom(context, this.element, {
              id: atomConfig.id,
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
              id: atomConfig.id,
              icon: atomConfig.icon,
              size: atomConfig.size,
              position: atomConfig.position
            }));
            break;
          case 'canvas':
            this.contentAtoms.push(new Atoms.CanvasAtom(context, this.element, {
              id: atomConfig.id,
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

  private createAnimationAtoms(animationConfigs: any[]): void {
    animationConfigs.forEach(config => {
      const context = this.createContext();
      try {
        switch (config.capability) {
          case 'scale':
            this.animationAtoms.scale = new Atoms.ScaleAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 1,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case 'opacity':
            this.animationAtoms.opacity = new Atoms.OpacityAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 1,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case 'rotate':
            this.animationAtoms.rotate = new Atoms.RotateAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 0,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case 'translate':
            this.animationAtoms.translate = new Atoms.TranslateAtom(context, this.element, {
              id: config.id,
              trigger: config.trigger,
              keepOnRelease: config.keepOnRelease
            }, this.state.position);
            break;
          case 'height':
            this.animationAtoms.height = new Atoms.HeightAtom(context, this.element, {
              id: config.id,
              collapsedValue: config.collapsedValue,
              moleculeHeight: this.molecule.height ?? this.element.offsetHeight,
              trigger: config.trigger,
              hiddenAtomIds: config.hiddenAtomIds,
              fixedAtomIds: config.fixedAtomIds,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case 'width':
            this.animationAtoms.width = new Atoms.WidthAtom(context, this.element, {
              id: config.id,
              value: config.value,
              trigger: config.trigger,
              defaultValue: config.defaultValue ?? 1,
              keepOnRelease: config.keepOnRelease,
              toggleOnClick: config.toggleOnClick,
              duration: config.duration
            });
            break;
          case 'collapse':
            if (!this.animationAtoms.collapse) {
              this.animationAtoms.collapse = [];
            }
            this.animationAtoms.collapse.push(new Atoms.CollapseAtom(
              context,
              this.element,
              {
                id: config.id,
                group: config.group,
                expandedValue: config.expandedValue,
                collapsedValue: config.collapsedValue
              },
              this.state.collapsedGroups
            ));
            break;
        }
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建动画原子失败:`, error);
      }
    });
  }

  private createInputAtoms(atoms: any[]): void {
    const clickConfig = atoms.find(a => a.capability === 'click');
    if (clickConfig) {
      const context = this.createContext();
      try {
        new Atoms.ClickAtom(context, this.element, {
          id: clickConfig.id,
          onClick: (_e, clickCount) => {
            this.updateClickState(true, clickCount);
          },
          onMouseUp: () => {
            this.updateClickRelease();
          },
          onDoubleClick: (e) => {
            this.updateDoubleClick();
            clickConfig.onDoubleClick?.(e);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ClickAtom失败:`, error);
      }
    }

    const dragConfig = atoms.find(a => a.capability === 'drag');
    if (dragConfig) {
      const context = this.createContext();
      try {
        new Atoms.DragAtom(context, this.element, {
          handle: dragConfig.handle
        }, {
          id: dragConfig.id,
          onDragStart: (mouse) => {
            this.updateDragStart(mouse);
          },
          onDragMove: (mouse) => {
            this.updateDragMove(mouse);
          },
          onDragEnd: () => {
            this.updateDragEnd();
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建DragAtom失败:`, error);
      }
    }

    const resizeConfig = atoms.find(a => a.capability === 'resize');
    if (resizeConfig) {
      const context = this.createContext();
      try {
        new Atoms.ResizeAtom(context, this.element, {
          id: resizeConfig.id,
          minWidth: resizeConfig.minWidth,
          minHeight: resizeConfig.minHeight,
          maxWidth: resizeConfig.maxWidth,
          maxHeight: resizeConfig.maxHeight
        }, {
          onResizeStart: (size) => {
            this.updateResizeStart(size);
            resizeConfig.onResizeStart?.(size);
          },
          onResize: (size) => {
            this.updateResizeMove(size);
            resizeConfig.onResize?.(size);
          },
          onResizeEnd: (size) => {
            this.updateResizeEnd(size);
            resizeConfig.onResizeEnd?.(size);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ResizeAtom失败:`, error);
      }
    }

    const scrollConfig = atoms.find(a => a.capability === 'scroll');
    if (scrollConfig) {
      const context = this.createContext();
      try {
        new Atoms.ScrollAtom(context, this.element, {
          id: scrollConfig.id,
          direction: scrollConfig.direction,
          maxScrollX: scrollConfig.maxScrollX,
          maxScrollY: scrollConfig.maxScrollY
        }, {
          onScroll: (pos) => {
            this.updateScrollState(pos.scrollX, pos.scrollY);
            scrollConfig.onScroll?.(pos);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ScrollAtom失败:`, error);
      }
    }

    const hoverConfig = atoms.find(a => a.capability === 'hover');
    if (hoverConfig) {
      const context = this.createContext();
      try {
        new Atoms.HoverAtom(context, this.element, {
          id: hoverConfig.id,
          onHoverStart: () => {
            this.updateHoverState(true);
          },
          onHoverEnd: () => {
            this.updateHoverState(false);
          }
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建HoverAtom失败:`, error);
      }
    }

    const collapseConfigs = atoms.filter(a => a.capability === 'collapse');
    collapseConfigs.forEach(config => {
      this.element.addEventListener('click', () => {
        if (this.animationAtoms.collapse) {
          const collapseAtom = this.animationAtoms.collapse.find(c => c.getGroup() === config.group);
          if (collapseAtom) {
            collapseAtom.toggle();
          }
        }
      });
    });
  }

  private createResizeHandles(configs: any[]): void {
    configs.forEach(config => {
      const context = this.createContext();
      try {
        new Atoms.ResizeHandleAtom(context, this.element, {
          id: config.id,
          edge: config.edge,
          minWidth: config.minWidth,
          minHeight: config.minHeight,
          handleSize: config.handleSize,
          handleColor: config.handleColor,
          scaleMode: config.scaleMode
        }, {
          onResizeStart: (size) => this.updateResizeStart(size),
          onResize: (size) => this.updateResizeMove(size),
          onResizeEnd: (size) => this.updateResizeEnd(size)
        });
      } catch (error) {
        console.error(`[Beaker Error] ${this.id} - 创建ResizeHandleAtom失败:`, error);
      }
    });
  }

  private notifyHoverChange(isHovered: boolean): void {
    this.animationAtoms.scale?.onHoverChange(isHovered);
    this.animationAtoms.opacity?.onHoverChange(isHovered);
    this.animationAtoms.rotate?.onHoverChange(isHovered);
    this.animationAtoms.height?.onHoverChange(isHovered);
    this.animationAtoms.width?.onHoverChange(isHovered);
  }

  private notifyClickChange(isClicked: boolean, clickCount: number): void {
    this.animationAtoms.scale?.onClickChange(isClicked, clickCount);
    this.animationAtoms.opacity?.onClickChange(isClicked, clickCount);
    this.animationAtoms.rotate?.onClickChange(isClicked, clickCount);
    this.animationAtoms.height?.onClickChange(isClicked, clickCount);
    this.animationAtoms.width?.onClickChange(isClicked, clickCount);
  }

  private notifyDoubleClick(): void {
    this.animationAtoms.scale?.onDoubleClick();
    this.animationAtoms.opacity?.onDoubleClick();
    this.animationAtoms.rotate?.onDoubleClick();
    this.animationAtoms.height?.onDoubleClick();
    this.animationAtoms.width?.onDoubleClick();
  }

  private emitStateChange(partialState: Partial<BakerState>): void {
    if (this.onStateChange) {
      this.onStateChange(this.id, partialState);
    }
  }

  public updateHoverState(isHovered: boolean): void {
    this.state.isHovered = isHovered;
    this.notifyHoverChange(isHovered);
    this.emitStateChange({ isHovered });
  }

  public updateClickState(isClicked: boolean, clickCount: number): void {
    this.state.isClicked = isClicked;
    this.notifyClickChange(isClicked, clickCount);
    this.emitStateChange({ isClicked });
  }

  public updateClickRelease(): void {
    this.state.isClicked = false;
    this.notifyClickChange(false, 0);
    this.emitStateChange({ isClicked: false });
  }

  public updateDoubleClick(): void {
    this.notifyDoubleClick();
  }

  public updateDragStart(mouse: { clientX: number; clientY: number }): void {
    this.state.isDragging = true;
    this.animationAtoms.translate?.onDragStart(mouse);
    this.emitStateChange({ isDragging: true });
  }

  public updateDragMove(mouse: { clientX: number; clientY: number }): void {
    this.animationAtoms.translate?.onDragMove(mouse);
  }

  public updateDragEnd(): void {
    this.state.isDragging = false;
    this.animationAtoms.translate?.onDragEnd();
    this.emitStateChange({ isDragging: false });
  }

  public updateResizeStart(size: { width: number; height: number }): void {
    this.state.isResizing = true;
    this.state.width = size.width;
    this.state.height = size.height;
    this.emitStateChange({ isResizing: true, width: size.width, height: size.height });
  }

  public updateResizeMove(size: { width: number; height: number }): void {
    this.state.width = size.width;
    this.state.height = size.height;
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;
    this.emitStateChange({ width: size.width, height: size.height });
  }

  public updateResizeEnd(size: { width: number; height: number }): void {
    this.state.isResizing = false;
    this.state.width = size.width;
    this.state.height = size.height;
    this.emitStateChange({ isResizing: false, width: size.width, height: size.height });
  }

  public updateScrollState(scrollX?: number, scrollY?: number): void {
    if (scrollX !== undefined) {
      this.state.scrollX = scrollX;
    }
    if (scrollY !== undefined) {
      this.state.scrollY = scrollY;
    }
    this.emitStateChange({ scrollX: this.state.scrollX, scrollY: this.state.scrollY });
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
    if (this.animationAtoms.translate) {
      this.animationAtoms.translate.updateOrigin({ x, y });
    }
    if (this.onStateChange) {
      this.onStateChange(this.id, { position: { x, y } });
    }
  }
}