import type { 
  Atom, TextAtom, ImageAtom, VideoAtom, AudioAtom, CodeAtom, IconAtom,
  BackgroundAtom, BorderAtom, ShadowAtom, CSSProperties
} from './types';

export class AtomRenderer {
  render(atom: Atom): HTMLElement {
    switch (atom.capability) {
      case 'text':
        return this.renderText(atom as TextAtom);
      case 'image':
        return this.renderImage(atom as ImageAtom);
      case 'video':
        return this.renderVideo(atom as VideoAtom);
      case 'audio':
        return this.renderAudio(atom as AudioAtom);
      case 'code':
        return this.renderCode(atom as CodeAtom);
      case 'icon':
        return this.renderIcon(atom as IconAtom);
      case 'background':
        return this.renderBackground(atom as BackgroundAtom);
      case 'border':
        return this.renderBorder(atom as BorderAtom);
      case 'shadow':
        return this.renderShadow(atom as ShadowAtom);
      default:
        return document.createElement('div');
    }
  }

  private renderText(atom: TextAtom): HTMLElement {
    const el = document.createElement('div');
    el.textContent = atom.text;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      fontSize: `${atom.size}px`,
      color: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      lineHeight: 1.4,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderImage(atom: ImageAtom): HTMLElement {
    const el = document.createElement('img');
    el.src = atom.src;
    el.alt = atom.alt || '';
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      width: `${atom.width}px`,
      height: `${atom.height}px`,
      objectFit: 'cover',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderVideo(atom: VideoAtom): HTMLElement {
    const el = document.createElement('video');
    el.src = atom.src;
    if (atom.width) el.width = atom.width;
    if (atom.height) el.height = atom.height;
    el.controls = true;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderAudio(atom: AudioAtom): HTMLElement {
    const el = document.createElement('audio');
    el.src = atom.src;
    el.controls = true;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderCode(atom: CodeAtom): HTMLElement {
    const el = document.createElement('pre');
    el.textContent = atom.code;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      backgroundColor: '#f5f5f5',
      padding: '12px',
      borderRadius: '6px',
      overflow: 'auto',
      fontSize: '14px',
      fontFamily: 'monospace',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderIcon(atom: IconAtom): HTMLElement {
    const el = document.createElement('span');
    el.textContent = atom.icon;
    
    const styles: CSSProperties = {
      position: 'absolute',
      left: `${atom.position?.x ?? 0}px`,
      top: `${atom.position?.y ?? 0}px`,
      zIndex: atom.position?.z,
      fontSize: `${atom.size || 24}px`,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderBackground(atom: BackgroundAtom): HTMLElement {
    const el = document.createElement('div');
    
    const hasCustomPosition = atom.position?.x !== undefined || atom.position?.y !== undefined;
    const hasCustomSize = atom.width !== undefined || atom.height !== undefined;

    const styles: CSSProperties = {
      position: 'absolute',
      left: hasCustomPosition ? `${atom.position?.x ?? 0}px` : '0',
      top: hasCustomPosition ? `${atom.position?.y ?? 0}px` : '0',
      zIndex: atom.position?.z ?? 0,
      width: hasCustomSize ? `${atom.width ?? '100%'}` : '100%',
      height: hasCustomSize ? `${atom.height ?? '100%'}` : '100%',
      backgroundColor: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
      borderRadius: atom.radius !== undefined ? `${atom.radius}px` : undefined,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderBorder(atom: BorderAtom): HTMLElement {
    const el = document.createElement('div');
    
    const hasCustomPosition = atom.position?.x !== undefined || atom.position?.y !== undefined;
    const hasCustomSize = atom.borderWidth !== undefined || atom.borderHeight !== undefined;

    const styles: CSSProperties = {
      position: 'absolute',
      left: hasCustomPosition ? `${atom.position?.x ?? 0}px` : '0',
      top: hasCustomPosition ? `${atom.position?.y ?? 0}px` : '0',
      zIndex: atom.position?.z ?? 0,
      width: hasCustomSize ? `${atom.borderWidth ?? '100%'}` : '100%',
      height: hasCustomSize ? `${atom.borderHeight ?? '100%'}` : '100%',
      boxSizing: 'border-box',
      border: `${atom.width}px solid rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
      borderRadius: atom.radius ? `${atom.radius}px` : '0px',
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private renderShadow(atom: ShadowAtom): HTMLElement {
    const el = document.createElement('div');
    
    const hasCustomPosition = atom.position?.x !== undefined || atom.position?.y !== undefined;
    const hasCustomSize = atom.shadowWidth !== undefined || atom.shadowHeight !== undefined;

    const styles: CSSProperties = {
      position: 'absolute',
      left: hasCustomPosition ? `${atom.position?.x ?? 0}px` : '0',
      top: hasCustomPosition ? `${atom.position?.y ?? 0}px` : '0',
      zIndex: atom.position?.z ?? 0,
      width: hasCustomSize ? `${atom.shadowWidth ?? '100%'}` : '100%',
      height: hasCustomSize ? `${atom.shadowHeight ?? '100%'}` : '100%',
      boxShadow: `${atom.x}px ${atom.y}px ${atom.blur}px rgba(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]}, 0.25)`,
    };
    
    this.applyStyles(el, styles);
    return el;
  }

  private applyStyles(element: HTMLElement, styles: CSSProperties): void {
    Object.entries(styles).forEach(([key, value]) => {
      if (value !== undefined) {
        (element.style as any)[key] = value;
      }
    });
  }
}

export const renderAtom = (atom: Atom): HTMLElement => {
  const renderer = new AtomRenderer();
  return renderer.render(atom);
};
