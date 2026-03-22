import type { Molecule, Atom } from '../types';

interface ScalableProps {
  content: Atom;
  minScale?: number;
  maxScale?: number;
  transition?: string;
}

export const createScalable = ({
  content,
  minScale = 1,
  maxScale = 1.1,
  transition = 'transform 0.2s'
}: ScalableProps): Molecule => ({
  id: `scalable-${content.id}`,
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

export default createScalable;
