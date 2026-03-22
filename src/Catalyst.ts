import type { Atom, ContentAtom, Position } from './types';

const CONTENT_CAPABILITIES = ['text', 'image', 'video', 'audio', 'code', 'icon'];
const DECORATION_CAPABILITIES = ['background', 'border', 'shadow'];

const getAbsolutePosition = (
  atomPosition: Position | undefined,
  moleculePosition: Position | undefined
): Position => {
  const baseX = moleculePosition?.x || 0;
  const baseY = moleculePosition?.y || 0;
  const baseZ = moleculePosition?.z;

  if (!atomPosition) {
    return { x: baseX, y: baseY, z: baseZ };
  }

  return {
    x: baseX + atomPosition.x,
    y: baseY + atomPosition.y,
    z: atomPosition.z,
  };
};

export const Catalyst = {
  decompose: (
    atoms: Atom[],
    moleculePosition?: Position
  ): { renderable: ContentAtom[]; others: Atom[] } => {
    const renderable: ContentAtom[] = [];
    const others: Atom[] = [];

    atoms.forEach(atom => {
      if (CONTENT_CAPABILITIES.includes(atom.capability)) {
        const absoluteAtom = {
          ...atom,
          position: getAbsolutePosition(atom.position, moleculePosition),
        } as ContentAtom;
        renderable.push(absoluteAtom);
      } else if (DECORATION_CAPABILITIES.includes(atom.capability)) {
        others.push(atom);
      } else {
        others.push(atom);
      }
    });

    return { renderable, others };
  }
};
