import type { Molecule, Atom } from '../types';

interface ClickableProps {
  content: Atom;
  cursor?: string;
  transition?: string;
}

export const createClickable = ({ content, cursor = 'pointer', transition = 'opacity 0.1s' }: ClickableProps): Molecule => ({
  id: `clickable-${content.id}`,
  level: 'molecule',
  children: [
    {
      ...content,
      style: {
        ...content.style,
        cursor,
        transition,
      },
    },
  ],
});

export default createClickable;
