import type { Molecule, Atom } from '../types';

interface SwitchableProps {
  onContent: Atom;
  offContent: Atom;
  onColor?: string;
  offColor?: string;
}

export const createSwitchable = ({
  onContent,
  offContent,
  onColor = '#10b981',
  offColor = '#e5e7eb'
}: SwitchableProps): Molecule => ({
  id: `switchable-${onContent.id}`,
  level: 'molecule',
  children: [onContent],
});

export default createSwitchable;
