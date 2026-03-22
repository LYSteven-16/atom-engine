import React from 'react';
import type { Position } from '../types';

interface BaseAtom {
  position?: Position;
}

interface DragAtom extends BaseAtom {
  capability: 'drag';
}

interface ResizeAtom extends BaseAtom {
  capability: 'resize';
  direction?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'all';
}

interface ScrollAtom extends BaseAtom {
  capability: 'scroll';
}

interface ClickAtom extends BaseAtom {
  capability: 'click';
}

type InputAtom = DragAtom | ResizeAtom | ScrollAtom | ClickAtom;

const DragRenderer = (atom: DragAtom) => {
  return null;
};

const ResizeRenderer = (atom: ResizeAtom) => {
  return null;
};

const ScrollRenderer = (atom: ScrollAtom) => {
  return null;
};

const ClickRenderer = (atom: ClickAtom) => {
  return null;
};

export type { DragAtom, ResizeAtom, ScrollAtom, ClickAtom, InputAtom };

export const inputRenderers = {
  drag: DragRenderer,
  resize: ResizeRenderer,
  scroll: ScrollRenderer,
  click: ClickRenderer,
};

export const renderInput = (atom: InputAtom) => {
  switch (atom.capability) {
    case 'drag': return DragRenderer(atom);
    case 'resize': return ResizeRenderer(atom);
    case 'scroll': return ScrollRenderer(atom);
    case 'click': return ClickRenderer(atom);
    default: return null;
  }
};
