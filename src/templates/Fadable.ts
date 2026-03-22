import type { Molecule, Atom } from '../types';

interface FadableProps {
  content: Atom;
  minOpacity?: number;
  maxOpacity?: number;
  transition?: string;
}

export const createFadable = ({
  content,
  minOpacity = 0.3,
  maxOpacity = 1,
  transition = 'opacity 0.3s'
}: FadableProps): Molecule => ({
  id: `fadable-${content.id}`,
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

export default createFadable;
