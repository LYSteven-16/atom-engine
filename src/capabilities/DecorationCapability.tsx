import React from 'react';
import type { Position } from '../types';

interface BaseAtom {
  position?: Position;
}

interface BackgroundAtom extends BaseAtom {
  capability: 'background';
  color: [number, number, number];
}

interface BorderAtom extends BaseAtom {
  capability: 'border';
  width: number;
  color: [number, number, number];
  radius?: number;
}

interface ShadowAtom extends BaseAtom {
  capability: 'shadow';
  x: number;
  y: number;
  blur: number;
  color: [number, number, number];
}

type DecorationAtom = BackgroundAtom | BorderAtom | ShadowAtom;

const applyPosition = (position?: Position): React.CSSProperties => ({
  position: position ? 'absolute' : undefined,
  left: position?.x,
  top: position?.y,
  zIndex: position?.z,
});

const BackgroundRenderer = (atom: BackgroundAtom) => (
  <div style={{
    ...applyPosition(atom.position),
    backgroundColor: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
    width: '100%',
    height: '100%',
  }} />
);

const BorderRenderer = (atom: BorderAtom) => (
  <div style={{
    ...applyPosition(atom.position),
    border: `${atom.width}px solid rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
    borderRadius: atom.radius || 0,
    width: '100%',
    height: '100%',
  }} />
);

const ShadowRenderer = (atom: ShadowAtom) => (
  <div style={{
    ...applyPosition(atom.position),
    boxShadow: `${atom.x}px ${atom.y}px ${atom.blur}px rgba(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]}, 1)`,
    width: '100%',
    height: '100%',
  }} />
);

export type { BackgroundAtom, BorderAtom, ShadowAtom, DecorationAtom };

export const decorationRenderers = {
  background: BackgroundRenderer,
  border: BorderRenderer,
  shadow: ShadowRenderer,
};

export const renderDecoration = (atom: DecorationAtom) => {
  switch (atom.capability) {
    case 'background': return BackgroundRenderer(atom);
    case 'border': return BorderRenderer(atom);
    case 'shadow': return ShadowRenderer(atom);
    default: return null;
  }
};
