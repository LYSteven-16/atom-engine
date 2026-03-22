import type { Molecule, Atom } from '../types';

interface DraggableProps {
  content: Atom;
}

export const createDraggable = ({ content }: DraggableProps): Molecule => ({
  id: `draggable-${content.id}`,
  level: 'molecule',
  children: [content],
});

export default createDraggable;
