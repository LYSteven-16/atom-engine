import React, { useState } from 'react';
import type { Position } from '../types';

type Trigger = 'hover' | 'click' | 'auto';

interface BaseAtom {
  position?: Position;
}

interface ScaleAtom extends BaseAtom {
  capability: 'scale';
  value: number;
  trigger: Trigger;
}

interface OpacityAtom extends BaseAtom {
  capability: 'opacity';
  value: number;
  trigger: Trigger;
}

interface RotateAtom extends BaseAtom {
  capability: 'rotate';
  value: number;
  trigger: Trigger;
}

interface TranslateAtom extends BaseAtom {
  capability: 'translate';
  x: number;
  y: number;
  trigger: Trigger;
}

type AnimationAtom = ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom;

const applyPosition = (position?: Position): React.CSSProperties => ({
  position: position ? 'absolute' : undefined,
  left: position?.x,
  top: position?.y,
  zIndex: position?.z,
});

const ScaleRenderer = (atom: ScaleAtom) => {
  const [active, setActive] = useState(false);

  const handlers = atom.trigger === 'hover'
    ? { onMouseEnter: () => setActive(true), onMouseLeave: () => setActive(false) }
    : atom.trigger === 'click'
    ? { onClick: () => setActive(!active) }
    : {};

  return (
    <div
      style={{
        ...applyPosition(atom.position),
        display: 'inline-block',
        transition: 'transform 0.2s ease',
        transform: active ? `scale(${atom.value})` : 'scale(1)',
        cursor: atom.trigger !== 'auto' ? 'pointer' : 'default',
      }}
      {...handlers}
    />
  );
};

const OpacityRenderer = (atom: OpacityAtom) => {
  const [active, setActive] = useState(false);

  const handlers = atom.trigger === 'hover'
    ? { onMouseEnter: () => setActive(true), onMouseLeave: () => setActive(false) }
    : atom.trigger === 'click'
    ? { onClick: () => setActive(!active) }
    : {};

  return (
    <div
      style={{
        ...applyPosition(atom.position),
        transition: 'opacity 0.3s ease',
        opacity: active ? atom.value : 1,
        cursor: atom.trigger !== 'auto' ? 'pointer' : 'default',
      }}
      {...handlers}
    />
  );
};

const RotateRenderer = (atom: RotateAtom) => {
  const [rotation, setRotation] = useState(0);

  const handleClick = () => {
    if (atom.trigger === 'click') {
      setRotation(rotation + atom.value);
    }
  };

  return (
    <div
      style={{
        ...applyPosition(atom.position),
        display: 'inline-block',
        cursor: atom.trigger === 'click' ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          transition: 'transform 0.3s ease',
          transform: `rotate(${rotation}deg)`,
          display: 'inline-block',
        }}
      />
    </div>
  );
};

const TranslateRenderer = (atom: TranslateAtom) => {
  const [active, setActive] = useState(false);

  const handlers = atom.trigger === 'hover'
    ? { onMouseEnter: () => setActive(true), onMouseLeave: () => setActive(false) }
    : atom.trigger === 'click'
    ? { onClick: () => setActive(!active) }
    : {};

  return (
    <div
      style={{
        ...applyPosition(atom.position),
        display: 'inline-block',
        transition: 'transform 0.2s ease',
        transform: active ? `translate(${atom.x}px, ${atom.y}px)` : 'translate(0, 0)',
        cursor: atom.trigger !== 'auto' ? 'pointer' : 'default',
      }}
      {...handlers}
    />
  );
};

export type { ScaleAtom, OpacityAtom, RotateAtom, TranslateAtom, AnimationAtom, Trigger };

export const animationRenderers = {
  scale: ScaleRenderer,
  opacity: OpacityRenderer,
  rotate: RotateRenderer,
  translate: TranslateRenderer,
};

export const renderAnimation = (atom: AnimationAtom) => {
  switch (atom.capability) {
    case 'scale': return ScaleRenderer(atom);
    case 'opacity': return OpacityRenderer(atom);
    case 'rotate': return RotateRenderer(atom);
    case 'translate': return TranslateRenderer(atom);
    default: return null;
  }
};
