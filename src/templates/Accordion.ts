import type { Molecule, Atom } from '../types';

interface AccordionItem {
  id: string;
  title: Atom;
  content: Atom;
}

interface AccordionProps {
  items: AccordionItem[];
}

export const createAccordion = ({ items }: AccordionProps): Molecule => ({
  id: `accordion-${items[0]?.id || 'new'}`,
  level: 'molecule',
  children: items.flatMap(item => [item.title, item.content]),
});

export default createAccordion;
