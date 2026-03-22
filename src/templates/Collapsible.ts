import type { Molecule, Atom } from '../types';

interface CollapsibleProps {
  content: Atom;
  collapsedHeight?: number;
  transition?: string;
}

export const createCollapsible = ({
  content,
  collapsedHeight = 0,
  transition = 'max-height 0.3s ease'
}: CollapsibleProps): Molecule => ({
  id: `collapsible-${content.id}`,
  level: 'molecule',
  children: [content],
});

export default createCollapsible;
