import { Molecule } from './types';

export class SubstanceManager {
  static process(molecules: Molecule[], cellWidth: number = 100, cellHeight: number = 100): Molecule[] {
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
        
        const sameRowMolecules = moleculesWithDefaults.filter(m => 
          m.vertical === currentMolecule.vertical && 
          m.id !== currentMolecule.id
        );

        if (sameRowMolecules.length > 0) {
          const nearest = sameRowMolecules.reduce((prev, curr) => {
            const prevDistance = Math.abs((prev.position?.x ?? 0) - (originalPosition.x));
            const currDistance = Math.abs((curr.position?.x ?? 0) - (originalPosition.x));
            return currDistance < prevDistance ? curr : prev;
          });

          const nearestRightEdge = (nearest.position?.x ?? 0) + cellWidth + (nearest.horizontalGap ?? defaultGap);
          const nearestLeftEdge = (nearest.position?.x ?? 0) - cellWidth - (nearest.horizontalGap ?? defaultGap);

          if (originalPosition.x >= (nearest.position?.x ?? 0)) {
            x = nearestRightEdge;
          } else {
            x = nearestLeftEdge;
          }
        } else {
          x = originalPosition.x;
        }
      } else if (hasHorizontal && !hasVertical) {
        x = (currentMolecule.horizontal! - 1) * (cellWidth + (currentMolecule.horizontalGap ?? defaultGap));
        y = originalPosition.y;
      } else {
        x = (currentMolecule.horizontal! - 1) * (cellWidth + (currentMolecule.horizontalGap ?? defaultGap));
        y = (currentMolecule.vertical! - 1) * (cellHeight + (currentMolecule.verticalGap ?? defaultGap));
      }

      return {
        ...currentMolecule,
        position: { x, y }
      };
    });
  }
}
