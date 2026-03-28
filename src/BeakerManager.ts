import { Beaker, type BakerState } from './Beaker';
import type { Molecule } from './molecules';

export class BeakerManager {
  private bakers: Map<string, Beaker> = new Map();
  private bakerStates: Map<string, BakerState> = new Map();
  private bakerIdCounter: number = 0;
  private defaultContainer: HTMLElement;

  constructor(molecules: Molecule[], container?: HTMLElement) {
    this.defaultContainer = container ?? document.body;
    
    molecules.forEach((molecule) => {
      this.addMolecule(molecule);
    });
  }

  public addMolecule(molecule: Molecule, container?: HTMLElement): Beaker {
    const bakerIndex = this.bakerIdCounter;
    const bakerId = `baker-${this.bakerIdCounter++}`;
    const baker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
    this.bakers.set(bakerId, baker);
    this.bakerStates.set(bakerId, baker.getState());
    (container ?? this.defaultContainer).appendChild(baker.element);
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
      this.defaultContainer.appendChild(newBaker.element);
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
}
