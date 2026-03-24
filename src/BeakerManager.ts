import { Beaker, type BakerState } from './Beaker';
import type { Molecule } from './molecules';

export class BeakerManager {
  private bakers: Map<string, Beaker> = new Map();
  private bakerStates: Map<string, BakerState> = new Map();
  private bakerIdCounter: number = 0;

  constructor(molecules: Molecule[]) {
    molecules.forEach((molecule) => {
      const bakerIndex = this.bakerIdCounter;
      const bakerId = `baker-${this.bakerIdCounter++}`;
      const baker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
      this.bakers.set(bakerId, baker);
      this.bakerStates.set(bakerId, baker.getState());
      document.body.appendChild(baker.element);
    });
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
