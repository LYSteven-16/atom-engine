import type { Molecule, Atom } from '../types';

interface RotatableProps {
  content: Atom;
  step?: number;
  transition?: string;
}

export const createRotatable = ({
  content,
  step = 90,
  transition = 'transform 0.3s'
}: RotatableProps): Molecule => ({
  id: `rotatable-${content.id}`,
  level: 'molecule',
  children: [
    {
      ...content,
      style: {
        ...content.style,
        transition,
      },
    },
  ],
});

export default createRotatable;
