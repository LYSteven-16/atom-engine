import { BeakerManager } from './BeakerManager';
import type { Molecule } from './molecules';

export class SubstanceManager {
  private _beakerManager: BeakerManager;

  constructor(molecules: Molecule[]) {
    const processedMolecules = this.process(molecules);
    this._beakerManager = new BeakerManager(processedMolecules);
  }

  public getBakerManager(): BeakerManager {
    return this._beakerManager;
  }

  private process(molecules: Molecule[], cellWidth: number = 100, cellHeight: number = 100): Molecule[] {
    const hasVerticalOrHorizontal = molecules.some(m =>
      m.vertical !== undefined || m.horizontal !== undefined
    );

    if (!hasVerticalOrHorizontal) {
      return molecules.map(molecule => ({
        ...molecule,
        position: molecule.position ?? { x: 0, y: 0 }
      }));
    }

    const moleculesWithDefaults = molecules.map(molecule => ({
      ...molecule,
      vertical: molecule.vertical ?? 1,
      horizontal: molecule.horizontal ?? 1,
      verticalGap: molecule.verticalGap ?? 10,
      horizontalGap: molecule.horizontalGap ?? 10,
      position: molecule.position ?? { x: 0, y: 0 }
    }));

    const defaultGap = 10;

    return moleculesWithDefaults.map(currentMolecule => {
      let x: number;
      let y: number;

      const hasVertical = currentMolecule.vertical !== undefined;
      const hasHorizontal = currentMolecule.horizontal !== undefined;
      const originalPosition = currentMolecule.position;

      if (hasVertical && !hasHorizontal) {
        y = (currentMolecule.vertical! - 1) * (cellHeight + (currentMolecule.verticalGap ?? defaultGap));
        x = originalPosition?.x ?? 0;
      } else if (hasHorizontal && !hasVertical) {
        x = (currentMolecule.horizontal! - 1) * (cellWidth + (currentMolecule.horizontalGap ?? defaultGap));
        y = originalPosition?.y ?? 0;
      } else {
        const row = Math.floor((currentMolecule.vertical! - 1));
        const col = currentMolecule.horizontal! - 1;
        x = col * (cellWidth + (currentMolecule.horizontalGap ?? defaultGap));
        y = row * (cellHeight + (currentMolecule.verticalGap ?? defaultGap));
      }

      return {
        ...currentMolecule,
        position: { x, y }
      };
    });
  }
}
