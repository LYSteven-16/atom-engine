import type { Molecule, Atom } from '../types';

interface ExpandableProps {
  content: Atom;
  collapsedHeight?: number;
  transition?: string;
}

export const createExpandable = ({
  content,
  collapsedHeight = 40,
  transition = 'max-height 0.3s ease'
}: ExpandableProps): Molecule => ({
  id: `expandable-${content.id}`,
  level: 'molecule',
  children: [content],
});

export default createExpandable;
