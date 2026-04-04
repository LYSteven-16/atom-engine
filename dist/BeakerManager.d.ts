// Built at: 2026-04-04T11:04:42Z sha:2200fc1a8787abbaf5491444322079288dc71f0b
interface Molecule {
    id: string;
    position?: {
        x: number;
        y: number;
        z?: number;
    };
    vertical?: number;
    horizontal?: number;
    verticalGap?: number;
    horizontalGap?: number;
    atoms: any[];
    molecules?: Molecule[];
    width?: number;
    height?: number;
    radius?: number;
    visible?: boolean;
    disabled?: boolean;
    selected?: boolean;
    className?: string;
    data?: Record<string, any>;
    onMount?: (element: HTMLElement) => void;
    onDestroy?: () => void;
}

interface BakerState {
    id: string;
    moleculeId: string;
    isHovered: boolean;
    isClicked: boolean;
    isDragging: boolean;
    isResizing: boolean;
    position: {
        x: number;
        y: number;
    };
    width?: number;
    height?: number;
    scrollX?: number;
    scrollY?: number;
    collapsedGroups: Set<string>;
    visible?: boolean;
    disabled?: boolean;
    selected?: boolean;
    opacity?: number;
    scale?: number;
}
type StateChangeCallback = (bakerId: string, state: Partial<BakerState>) => void;

declare class Beaker {
    readonly id: string;
    readonly molecule: Molecule;
    readonly element: HTMLElement;
    state: BakerState;
    readonly bakerIndex: number;
    private onStateChange;
    private contentAtoms;
    private atomIndexCounter;
    private decorationAtoms;
    private animationAtoms;
    private subBeakers;
    private originalSubBeakerStyles;
    private originalChildStyles;
    constructor(id: string, molecule: Molecule, bakerIndex: number, onStateChange?: StateChangeCallback);
    private createInitialState;
    private init;
    private createSubBeakers;
    private showError;
    private saveChildStyles;
    applyScale(scale: number): void;
    private scaleChildren;
    private createContext;
    private calculateContainerSize;
    private createDecorationAtoms;
    private createContentAtoms;
    private createAnimationAtoms;
    private createInputAtoms;
    private createResizeHandles;
    private notifyHoverChange;
    private notifyClickChange;
    private notifyDoubleClick;
    private emitStateChange;
    updateHoverState(isHovered: boolean): void;
    updateClickState(isClicked: boolean, clickCount: number): void;
    updateClickRelease(): void;
    updateDoubleClick(): void;
    updateDragStart(mouse: {
        clientX: number;
        clientY: number;
    }): void;
    updateDragMove(mouse: {
        clientX: number;
        clientY: number;
    }): void;
    updateDragEnd(): void;
    updateResizeStart(size: {
        width: number;
        height: number;
    }): void;
    updateResizeMove(size: {
        width: number;
        height: number;
    }): void;
    updateResizeEnd(size: {
        width: number;
        height: number;
    }): void;
    updateScrollState(scrollX?: number, scrollY?: number): void;
    updateState(newState: Partial<BakerState>): void;
    getState(): BakerState;
    updatePosition(x: number, y: number): void;
    show(): void;
    hide(): void;
    setVisible(visible: boolean): void;
    setSelected(selected: boolean): void;
    setDisabled(disabled: boolean): void;
    getElement(): HTMLElement;
    destroy(): void;
}

interface WorkplaceConfig {
    position?: {
        x: number;
        y: number;
    };
    positionType?: 'absolute' | 'fixed' | 'relative';
    width?: number | string;
    height?: number | string;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    showShadow?: boolean;
    shadowBlur?: number;
    shadowSpread?: number;
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    gradientType?: 'none' | 'linear' | 'radial';
    gradientAngle?: number;
    gradientColors?: string[];
    gradientStops?: number[];
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    clipContent?: boolean;
}
declare class BeakerManager {
    private bakers;
    private bakerStates;
    private bakerIdCounter;
    private workplace;
    private parentContainer;
    private workplaceConfig;
    constructor(molecules: Molecule[], parentContainer?: HTMLElement, workplaceConfig?: WorkplaceConfig);
    private createWorkplace;
    /**
     * 将值转换为像素单位。如果是数字或纯数字字符串，则添加 'px'。
     */
    private applyWorkplaceStyles;
    addMolecule(molecule: Molecule): Beaker;
    removeMolecule(bakerId: string): void;
    updateMolecule(bakerId: string, molecule: Molecule): void;
    clearAll(): void;
    destroy(): void;
    private handleBakerStateChange;
    getBaker(id: string): Beaker | undefined;
    getAllBakers(): Beaker[];
    getBakerState(id: string): BakerState | undefined;
    getAllBakerStates(): BakerState[];
    getBakerCount(): number;
    getWorkplace(): HTMLElement;
    updateWorkplace(config: WorkplaceConfig): void;
}

export { BeakerManager, type WorkplaceConfig };
