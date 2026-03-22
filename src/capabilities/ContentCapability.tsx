import React from 'react';
import type { Position } from '../types';

interface BaseAtom {
  position?: Position;
}

interface TextAtom extends BaseAtom {
  capability: 'text';
  text: string;
  size: number;
  color: [number, number, number];
}

interface ImageAtom extends BaseAtom {
  capability: 'image';
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface VideoAtom extends BaseAtom {
  capability: 'video';
  src: string;
  width?: number;
  height?: number;
}

interface AudioAtom extends BaseAtom {
  capability: 'audio';
  src: string;
}

interface CodeAtom extends BaseAtom {
  capability: 'code';
  code: string;
  language?: string;
}

interface IconAtom extends BaseAtom {
  capability: 'icon';
  icon: string;
  size?: number;
}

type ContentAtom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom;

const applyPosition = (position?: Position): React.CSSProperties => ({
  position: position ? 'absolute' : undefined,
  left: position?.x,
  top: position?.y,
  zIndex: position?.z,
});

const TextRenderer = (atom: TextAtom) => (
  <div style={{
    ...applyPosition(atom.position),
    fontSize: atom.size,
    color: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  }}>
    {atom.text}
  </div>
);

const ImageRenderer = (atom: ImageAtom) => (
  <img
    src={atom.src}
    alt={atom.alt || ''}
    style={{
      ...applyPosition(atom.position),
      width: atom.width,
      height: atom.height,
      objectFit: 'cover' as const,
    }}
  />
);

const VideoRenderer = (atom: VideoAtom) => (
  <video
    src={atom.src}
    controls
    style={{
      ...applyPosition(atom.position),
      width: atom.width,
      height: atom.height,
    }}
  />
);

const AudioRenderer = (atom: AudioAtom) => (
  <audio src={atom.src} controls />
);

const CodeRenderer = (atom: CodeAtom) => (
  <pre style={{
    ...applyPosition(atom.position),
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    overflow: 'auto',
    fontSize: 14,
    fontFamily: 'monospace',
  }}>
    <code style={{ color: '#d4d4d4' }}>{atom.code}</code>
  </pre>
);

const IconRenderer = (atom: IconAtom) => (
  <span style={{ ...applyPosition(atom.position), fontSize: atom.size || 24 }}>{atom.icon}</span>
);

export type { TextAtom, ImageAtom, VideoAtom, AudioAtom, CodeAtom, IconAtom, ContentAtom };

export const contentRenderers = {
  text: TextRenderer,
  image: ImageRenderer,
  video: VideoRenderer,
  audio: AudioRenderer,
  code: CodeRenderer,
  icon: IconRenderer,
};

export const renderContent = (atom: ContentAtom) => {
  switch (atom.capability) {
    case 'text': return TextRenderer(atom);
    case 'image': return ImageRenderer(atom);
    case 'video': return VideoRenderer(atom);
    case 'audio': return AudioRenderer(atom);
    case 'code': return CodeRenderer(atom);
    case 'icon': return IconRenderer(atom);
    default: return null;
  }
};
