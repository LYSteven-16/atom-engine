import React from 'react';
import type { Position } from '../types';

interface BaseAtom {
  position?: Position;
}

interface ContainerAtom extends BaseAtom {
  capability: 'container';
}

interface SlotAtom extends BaseAtom {
  capability: 'slot';
  name?: string;
}

type ContainerCapabilityAtom = ContainerAtom | SlotAtom;

const applyPosition = (position?: Position): React.CSSProperties => ({
  position: position ? 'absolute' : undefined,
  left: position?.x,
  top: position?.y,
  zIndex: position?.z,
});

const ContainerRenderer = (atom: ContainerAtom) => (
  <div style={applyPosition(atom.position)} />
);

const SlotRenderer = (atom: SlotAtom) => (
  <div style={applyPosition(atom.position)} data-slot={atom.name} />
);

export type { ContainerAtom, SlotAtom, ContainerCapabilityAtom };

export const containerRenderers = {
  container: ContainerRenderer,
  slot: SlotRenderer,
};

export const renderContainer = (atom: ContainerCapabilityAtom) => {
  switch (atom.capability) {
    case 'container': return ContainerRenderer(atom);
    case 'slot': return SlotRenderer(atom);
    default: return null;
  }
};
