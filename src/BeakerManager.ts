import { Beaker, type BakerState } from './Beaker';
import type { Molecule } from './molecules';

export interface WorkplaceConfig {
  position?: { x: number; y: number };
  width?: number | string;
  height?: number | string;

  // 背景与边框
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;

  // 阴影配置
  showShadow?: boolean;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // 背景样式
  gradientType?: 'none' | 'linear' | 'radial';
  gradientAngle?: number;
  gradientColors?: string[];
  gradientStops?: number[];

  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';

  // 溢出配置
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  clipContent?: boolean;
}

export class BeakerManager {
  private bakers: Map<string, Beaker> = new Map();
  private bakerStates: Map<string, BakerState> = new Map();
  private bakerIdCounter: number = 0;
  private workplace: HTMLElement;
  private parentContainer: HTMLElement;
  private workplaceConfig: WorkplaceConfig = {};

  constructor(molecules: Molecule[], parentContainer?: HTMLElement, workplaceConfig?: WorkplaceConfig) {
    this.parentContainer = parentContainer ?? document.body;
    this.workplaceConfig = {
      backgroundColor: '#ffffff',
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#000000',
      showShadow: true,
      shadowBlur: 20,
      shadowSpread: 0,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      clipContent: true,
      overflow: 'visible',
      ...workplaceConfig
    };
    this.workplace = this.createWorkplace(this.workplaceConfig);
    
    molecules.forEach((molecule) => {
      this.addMolecule(molecule);
    });
  }

  private createWorkplace(config: WorkplaceConfig): HTMLElement {
    const workplace = document.createElement('div');
    workplace.className = 'atom-engine-workplace';
    this.workplace = workplace;
    
    // 先挂载到 DOM 树
    this.parentContainer.appendChild(workplace);
    
    // 再应用样式，确保依赖父容器计算的属性（如 width: 100%）能正确解析
    this.applyWorkplaceStyles(config);
    
    return workplace;
  }

  /**
   * 将值转换为像素单位。如果是数字或纯数字字符串，则添加 'px'。
   */
  private applyWorkplaceStyles(config: WorkplaceConfig): void {
    const style = this.workplace.style;
    const px = (v: number | string | undefined, def = '0px'): string => {
      if (v === undefined || v === null) return def;
      if (typeof v === 'number') return `${v}px`;
      if (/^\d+$/.test(v)) return `${v}px`;
      return v;
    };
    
    style.position = 'absolute';
    style.left = px(config.position?.x);
    style.top = px(config.position?.y);
    style.width = typeof config.width === 'number' ? `${config.width}px` : (config.width || '100%');
    style.height = typeof config.height === 'number' ? `${config.height}px` : (config.height || '100%');

    if (config.backgroundColor) {
      style.backgroundColor = config.backgroundColor;
    }
    if (config.borderRadius !== undefined) {
      style.borderRadius = px(config.borderRadius);
    }
    if (config.borderWidth !== undefined) {
      style.borderWidth = px(config.borderWidth);
      style.borderStyle = (typeof config.borderWidth === 'number' ? config.borderWidth : parseFloat(config.borderWidth)) > 0 ? 'solid' : 'none';
    }
    if (config.borderColor) {
      style.borderColor = config.borderColor;
    }

    if (config.showShadow === false) {
      style.boxShadow = 'none';
    } else if (
      config.showShadow || 
      config.shadowBlur !== undefined || 
      config.shadowSpread !== undefined || 
      config.shadowColor || 
      config.shadowOffsetX !== undefined || 
      config.shadowOffsetY !== undefined
    ) {
      const x = px(config.shadowOffsetX);
      const y = px(config.shadowOffsetY, '2px');
      const blur = px(config.shadowBlur, '20px');
      const spread = px(config.shadowSpread);
      const color = config.shadowColor ?? 'rgba(0,0,0,0.1)';
      style.boxShadow = `${x} ${y} ${blur} ${spread} ${color}`;
    }

    // Gradient
    if (config.gradientType && config.gradientType !== 'none' && config.gradientColors && config.gradientColors.length > 0) {
      const colors = config.gradientColors;
      const stops = config.gradientStops;
      const colorStrs = colors.map((c, i) => stops && stops[i] !== undefined ? `${c} ${stops[i] * 100}%` : c);
      
      if (config.gradientType === 'linear') {
        const angle = config.gradientAngle ?? 180;
        style.backgroundImage = `linear-gradient(${angle}deg, ${colorStrs.join(', ')})`;
      } else if (config.gradientType === 'radial') {
        style.backgroundImage = `radial-gradient(circle, ${colorStrs.join(', ')})`;
      }
    } else if (config.backgroundImage) {
      style.backgroundImage = `url(${config.backgroundImage})`;
      style.backgroundSize = config.backgroundSize ?? 'cover';
      style.backgroundPosition = config.backgroundPosition ?? 'center';
      style.backgroundRepeat = config.backgroundRepeat ?? 'no-repeat';
    } else if (config.gradientType === 'none') {
      style.backgroundImage = 'none';
    }

    // Overflow & Clip
    if (config.overflow) {
      style.overflow = config.overflow;
    }
    if (config.clipContent !== undefined) {
      style.overflow = config.clipContent ? 'hidden' : (config.overflow ?? 'visible');
    }
  }

  public addMolecule(molecule: Molecule): Beaker {
    const bakerIndex = this.bakerIdCounter;
    const bakerId = `baker-${this.bakerIdCounter++}`;
    const baker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
    this.bakers.set(bakerId, baker);
    this.bakerStates.set(bakerId, baker.getState());
    this.workplace.appendChild(baker.element);
    return baker;
  }

  public removeMolecule(bakerId: string): void {
    const baker = this.bakers.get(bakerId);
    if (baker) {
      baker.destroy();
      this.bakers.delete(bakerId);
      this.bakerStates.delete(bakerId);
    }
  }

  public updateMolecule(bakerId: string, molecule: Molecule): void {
    const baker = this.bakers.get(bakerId);
    if (baker) {
      baker.destroy();
      const bakerIndex = baker.bakerIndex;
      const newBaker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
      this.bakers.set(bakerId, newBaker);
      this.bakerStates.set(bakerId, newBaker.getState());
      this.workplace.appendChild(newBaker.element);
    }
  }

  public clearAll(): void {
    this.bakers.forEach((baker) => {
      baker.destroy();
    });
    this.bakers.clear();
    this.bakerStates.clear();
  }

  public destroy(): void {
    this.clearAll();
    if (this.workplace.parentNode) {
      this.workplace.parentNode.removeChild(this.workplace);
    }
  }

  private handleBakerStateChange(bakerId: string, state: Partial<BakerState>): void {
    const currentState = this.bakerStates.get(bakerId);
    if (currentState) {
      this.bakerStates.set(bakerId, { ...currentState, ...state });
    }
  }

  public getBaker(id: string): Beaker | undefined {
    return this.bakers.get(id);
  }

  public getAllBakers(): Beaker[] {
    return Array.from(this.bakers.values());
  }

  public getBakerState(id: string): BakerState | undefined {
    return this.bakerStates.get(id);
  }

  public getAllBakerStates(): BakerState[] {
    return Array.from(this.bakerStates.values());
  }

  public getBakerCount(): number {
    return this.bakers.size;
  }

  public getWorkplace(): HTMLElement {
    return this.workplace;
  }

  public updateWorkplace(config: WorkplaceConfig): void {
    this.workplaceConfig = { ...this.workplaceConfig, ...config };
    this.applyWorkplaceStyles(this.workplaceConfig);
  }
}
