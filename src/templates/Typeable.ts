import type { Molecule, Atom } from '../types';

interface TypeableProps {
  content: Atom;
  placeholder?: string;
}

export const createTypeable = ({ content, placeholder = '' }: TypeableProps): Molecule => ({
  id: `typeable-${content.id}`,
  level: 'molecule',
  children: [
    {
      ...content,
      capabilities: [...content.capabilities, 'text'],
    },
  ],
});

export default createTypeable;
