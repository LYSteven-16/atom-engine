import React from 'react';
import { Position } from './types';

export interface TextAtom {
  capability: 'text';
  position?: Position;
  text: string;
  size: number;
  color: [number, number, number];
}

export interface ImageAtom {
  capability: 'image';
  position?: Position;
  src: string;
  width: number;
  height: number;
  alt?: string;
}

export interface VideoAtom {
  capability: 'video';
  position?: Position;
  src: string;
  width?: number;
  height?: number;
}

export interface AudioAtom {
  capability: 'audio';
  position?: Position;
  src: string;
}

export interface CodeAtom {
  capability: 'code';
  position?: Position;
  code: string;
  language?: string;
}

export interface IconAtom {
  capability: 'icon';
  position?: Position;
  icon: string;
  size?: number;
}

export interface BackgroundAtom {
  capability: 'background';
  position?: Position;
  color: [number, number, number];
}

export interface BorderAtom {
  capability: 'border';
  position?: Position;
  width: number;
  color: [number, number, number];
  radius?: number;
}

export interface ShadowAtom {
  capability: 'shadow';
  position?: Position;
  x: number;
  y: number;
  blur: number;
  color: [number, number, number];
}

export interface ScaleAtom {
  capability: 'scale';
  position?: Position;
  value: number;
  trigger: 'hover' | 'click' | 'drag';
}

export interface OpacityAtom {
  capability: 'opacity';
  position?: Position;
  value: number;
  trigger: 'hover' | 'click' | 'drag';
}

export interface RotateAtom {
  capability: 'rotate';
  position?: Position;
  value: number;
  trigger: 'hover' | 'click';
}

export interface TranslateAtom {
  capability: 'translate';
  position?: Position;
  x: number;
  y: number;
  trigger: 'drag';
}

export interface DragAtom {
  capability: 'drag';
  position?: Position;
}

export interface ResizeAtom {
  capability: 'resize';
  position?: Position;
  direction?: 'horizontal' | 'vertical' | 'both';
}

export interface ScrollAtom {
  capability: 'scroll';
  position?: Position;
}

export interface ClickAtom {
  capability: 'click';
  position?: Position;
}

export interface GapAtom {
  capability: 'gap';
  position?: Position;
  size: number;
}

export interface ContainerAtom {
  capability: 'container';
  position?: Position;
}

export interface HeightAtom {
  capability: 'height';
  position?: Position;
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
}

export interface WidthAtom {
  capability: 'width';
  position?: Position;
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
}

export interface CollapseAtom {
  capability: 'collapse';
  position?: Position;
  group: string;
  collapsedValue?: number;
  expandedValue?: number;
}

export type Atom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom |
            BackgroundAtom | BorderAtom | ShadowAtom |
            ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom |
            DragAtom | ResizeAtom | ScrollAtom | ClickAtom |
            GapAtom | ContainerAtom |
            HeightAtom | WidthAtom | CollapseAtom;

export type ContentAtom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom;
export type DecorationAtom = BackgroundAtom | BorderAtom | ShadowAtom;
export type AnimationAtom = ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom | HeightAtom | WidthAtom | CollapseAtom;
export type InputAtom = DragAtom | ResizeAtom | ScrollAtom | ClickAtom;

export interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };
  atoms: Atom[];
}

const TextRenderer: React.FC<TextAtom> = (atom) => (
  <div style={{
    position: 'absolute',
    left: atom.position?.x,
    top: atom.position?.y,
    zIndex: atom.position?.z,
    fontSize: atom.size,
    color: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    lineHeight: 1.4,
  }}>
    {atom.text}
  </div>
);

const ImageRenderer: React.FC<ImageAtom> = (atom) => (
  <img
    src={atom.src}
    alt={atom.alt || ''}
    style={{
      position: 'absolute',
      left: atom.position?.x,
      top: atom.position?.y,
      zIndex: atom.position?.z,
      width: atom.width,
      height: atom.height,
      objectFit: 'cover',
    }}
  />
);

const VideoRenderer: React.FC<VideoAtom> = (atom) => (
  <video
    src={atom.src}
    controls
    style={{
      position: 'absolute',
      left: atom.position?.x,
      top: atom.position?.y,
      zIndex: atom.position?.z,
      width: atom.width || '100%',
      height: atom.height,
    }}
  />
);

const AudioRenderer: React.FC<AudioAtom> = (atom) => (
  <audio
    src={atom.src}
    controls
    style={{
      position: 'absolute',
      left: atom.position?.x,
      top: atom.position?.y,
      zIndex: atom.position?.z,
    }}
  />
);

const CodeRenderer: React.FC<CodeAtom> = (atom) => (
  <pre style={{
    position: 'absolute',
    left: atom.position?.x,
    top: atom.position?.y,
    zIndex: atom.position?.z,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    overflow: 'auto',
    fontSize: 14,
    fontFamily: 'monospace',
  }}>
    <code>{atom.code}</code>
  </pre>
);

const IconRenderer: React.FC<IconAtom> = (atom) => (
  <span style={{
    position: 'absolute',
    left: atom.position?.x,
    top: atom.position?.y,
    zIndex: atom.position?.z,
    fontSize: atom.size || 24,
  }}>
    {atom.icon}
  </span>
);

const RENDERERS: Record<string, React.FC<any>> = {
  text: TextRenderer,
  image: ImageRenderer,
  video: VideoRenderer,
  audio: AudioRenderer,
  code: CodeRenderer,
  icon: IconRenderer,
};

export const AtomRenderer: React.FC<{ atom: Atom }> = ({ atom }) => {
  const Renderer = RENDERERS[atom.capability];
  if (!Renderer) {
    console.warn(`Unknown atom capability: ${atom.capability}`);
    return null;
  }
  return <Renderer {...atom} />;
};
