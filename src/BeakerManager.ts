import type {
  Molecule, ContentAtom, DecorationAtom, AnimationAtom, InputAtom,
  CollapseAtom
} from './types';
import { Catalyst } from './Catalyst';
import { AtomRenderer } from './AtomRenderer';

export class BeakerManager {
  private element: HTMLElement;
  private molecule: Molecule;
  private triggers: Set<string> = new Set();
  private isDragging: boolean = false;
  private draggingId: string | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private collapseStates: Record<string, boolean> = {};
  private atomRenderer: AtomRenderer;

  constructor(molecule: Molecule) {
    this.molecule = molecule;
    this.element = document.createElement('div');
    this.atomRenderer = new AtomRenderer();

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
    this.element.style.transition = 'width 0.3s ease, height 0.3s ease, transform 0.2s ease, opacity 0.3s ease';
    this.element.style.cursor = 'default';
  }

  private decomposeAndRender(): void {
    const { atoms } = this.molecule;

    const { renderable, others } = Catalyst.decompose(atoms);

    const decorationAtoms = others.filter(a =>
      a.capability === 'background' || a.capability === 'border' || a.capability === 'shadow'
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
    this.applyAnimationStyles(animationAtoms);
    this.setupInputHandlers(inputAtoms, animationAtoms);
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

    if (backgroundAtom && borderAtom) {
      if (backgroundAtom.radius !== undefined && borderAtom.radius === undefined) {
        borderAtom.radius = backgroundAtom.radius;
      } else if (backgroundAtom.radius === undefined && borderAtom.radius !== undefined) {
        backgroundAtom.radius = borderAtom.radius;
      } else if (backgroundAtom.radius === undefined && borderAtom.radius === undefined) {
        const defaultRadius = 0;
        backgroundAtom.radius = defaultRadius;
        borderAtom.radius = defaultRadius;
      }
    }

    atoms.forEach(atom => {
      const element = this.atomRenderer.render(atom);
      this.element.appendChild(element);
    });
  }

  private renderContentAtoms(atoms: ContentAtom[]): void {
    atoms.forEach(atom => {
      const element = this.atomRenderer.render(atom);
      this.element.appendChild(element);
    });
  }

  private applyAnimationStyles(atoms: AnimationAtom[]): void {
    const { id } = this.molecule;
    const isHovered = this.triggers.has(`${id}-hover`);
    const isClicked = this.triggers.has(`${id}-click`);
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

    atoms.forEach(atom => {
      switch (atom.capability) {
        case 'scale':
          if (atom.trigger === 'hover' && isHovered) {
            scale = atom.value;
            hasScale = true;
          } else if (atom.trigger === 'click' && isClicked) {
            scale = atom.value;
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
          } else if (atom.trigger === 'click' && isClicked) {
            opacity = atom.value;
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
          } else if (atom.trigger === 'click' && isClicked) {
            rotate = atom.value;
            hasRotate = true;
          }
          break;
        case 'translate':
          if (isCurrentlyDragging) {
            translateX = atom.x + this.dragOffset.x;
            translateY = atom.y + this.dragOffset.y;
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
          }
          break;
        case 'width':
          if (atom.trigger === 'hover' && isHovered) {
            width = `${atom.value}px`;
            hasWidth = true;
          } else if (atom.trigger === 'click' && isClicked) {
            width = `${atom.value}px`;
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
    const { id } = this.molecule;
    const hasDrag = inputAtoms.some(a => a.capability === 'drag');
    const hasClick = inputAtoms.some(a => a.capability === 'click');
    const hasHoverTrigger = animationAtoms.some(a =>
      (a.capability === 'scale' || a.capability === 'opacity' ||
        a.capability === 'rotate' || a.capability === 'height' ||
        a.capability === 'width') &&
      (a as any).trigger === 'hover'
    );
    const collapseAtoms = animationAtoms.filter(a => a.capability === 'collapse') as CollapseAtom[];

    if (hasHoverTrigger) {
      this.element.addEventListener('mouseenter', () => this.trigger(`${id}-hover`));
      this.element.addEventListener('mouseleave', () => this.untrigger(`${id}-hover`));
    }

    if (hasClick) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.trigger(`${id}-click`);
        setTimeout(() => this.untrigger(`${id}-click`), 200);

        collapseAtoms.forEach(atom => {
          this.collapseStates[atom.group] = !this.collapseStates[atom.group];
        });
        this.updateAnimation();
      });
    }

    if (hasDrag) {
      this.element.style.cursor = 'move';
      this.element.addEventListener('mousedown', (e) => this.startDrag(e, id));
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
    const { atoms } = this.molecule;
    const { others } = Catalyst.decompose(atoms);
    const animationAtoms = others.filter(a =>
      a.capability === 'scale' || a.capability === 'opacity' || a.capability === 'rotate' ||
      a.capability === 'translate' || a.capability === 'height' || a.capability === 'width' ||
      a.capability === 'collapse'
    ) as AnimationAtom[];

    this.applyAnimationStyles(animationAtoms);
  }

  private startDrag(e: MouseEvent, id: string): void {
    e.preventDefault();
    this.isDragging = true;
    this.draggingId = id;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - e.clientX;
      const dy = moveEvent.clientY - e.clientY;
      this.dragOffset = { x: dx, y: dy };
      this.updateAnimation();
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      this.isDragging = false;
      this.draggingId = null;
      this.dragOffset = { x: 0, y: 0 };
      this.updateAnimation();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getSize(): { width: number; height: number } {
    return {
      width: parseFloat(this.element.style.width) || 220,
      height: parseFloat(this.element.style.height) || 120
    };
  }

  public getMolecule(): Molecule {
    return this.molecule;
  }
}
