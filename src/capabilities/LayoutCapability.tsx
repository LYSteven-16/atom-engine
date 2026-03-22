import React from 'react';
import type { Position } from '../types';

interface BaseAtom {
  position?: Position;
}

interface GapAtom extends BaseAtom {
  capability: 'gap';
  size: number;
}

type LayoutAtom = GapAtom;

const applyPosition = (position?: Position): React.CSSProperties => ({
  position: position ? 'absolute' : undefined,
  left: position?.x,
  top: position?.y,
  zIndex: position?.z,
});

const GapRenderer = (atom: GapAtom) => (
  <div style={{ ...applyPosition(atom.position), height: atom.size }} />
);

export type { GapAtom, LayoutAtom };

export const layoutRenderers = {
  gap: GapRenderer,
};

export const renderLayout = (atom: LayoutAtom) => {
  switch (atom.capability) {
    case 'gap': return GapRenderer(atom);
    default: return null;
  }
};
