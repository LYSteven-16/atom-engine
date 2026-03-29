import { Beaker, type BakerState } from './Beaker';
import type { Molecule } from './molecules';

export interface WorkplaceConfig {
  position?: { x: number; y: number };
  width?: number;
  height?: number;
}

export class BeakerManager {
  private bakers: Map<string, Beaker> = new Map();
  private bakerStates: Map<string, BakerState> = new Map();
  private bakerIdCounter: number = 0;
  private workplace: HTMLElement;
  private parentContainer: HTMLElement;

  constructor(molecules: Molecule[], parentContainer?: HTMLElement, workplaceConfig?: WorkplaceConfig) {
    this.parentContainer = parentContainer ?? document.body;
    this.workplace = this.createWorkplace(workplaceConfig);
    
    molecules.forEach((molecule) => {
      this.addMolecule(molecule);
    });
  }

  private createWorkplace(config?: WorkplaceConfig): HTMLElement {
    const workplace = document.createElement('div');
    workplace.className = 'atom-engine-workplace';
    
    if (config) {
      workplace.style.cssText = `
        position: absolute;
        left: ${config.position?.x ?? 0}px;
        top: ${config.position?.y ?? 0}px;
        width: ${config.width ?? '100%'};
        height: ${config.height ?? '100%'};
        overflow: visible;
      `;
    } else {
      workplace.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      `;
    }
    
    this.parentContainer.appendChild(workplace);
    return workplace;
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
    if (config.position) {
      this.workplace.style.left = `${config.position.x}px`;
      this.workplace.style.top = `${config.position.y}px`;
    }
    if (config.width !== undefined) {
      this.workplace.style.width = `${config.width}px`;
    }
    if (config.height !== undefined) {
      this.workplace.style.height = `${config.height}px`;
    }
  }
}
