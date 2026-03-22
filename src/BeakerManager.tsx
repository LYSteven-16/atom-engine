import React, { useState, useCallback, useMemo, useContext } from 'react';
import { Catalyst } from './Catalyst';
import { AtomRenderer, type Molecule, type Atom, type DecorationAtom, type AnimationAtom, type InputAtom, type HeightAtom, type WidthAtom, type CollapseAtom } from './AtomRenderer';
import { useGlobalState } from './AtomEngine';

interface BeakerManagerProps {
  molecule: Molecule;
}

const globalStateContext = React.createContext<ReturnType<typeof useGlobalState> | null>(null);

export const useBeakerState = () => {
  const context = useContext(globalStateContext);
  if (!context) {
    try {
      return useGlobalState();
    } catch {
      return null;
    }
  }
  return context;
};

export const BeakerManager: React.FC<BeakerManagerProps> = ({ molecule }) => {
  const { id, position, atoms } = molecule;
  const globalState = useBeakerState();
  
  const [triggers, setTriggers] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localSizes, setLocalSizes] = useState<Record<string, number>>({});

  const { renderable, others } = Catalyst.decompose(atoms, position);

  const decorationAtoms = others.filter(a =>
    a.capability === 'background' || a.capability === 'border' || a.capability === 'shadow'
  ) as DecorationAtom[];

  const animationAtoms = others.filter(a =>
    a.capability === 'scale' || a.capability === 'opacity' || a.capability === 'rotate' || a.capability === 'translate'
  ) as AnimationAtom[];

  const heightAtoms = others.filter(a => a.capability === 'height') as HeightAtom[];
  const widthAtoms = others.filter(a => a.capability === 'width') as WidthAtom[];
  const collapseAtoms = others.filter(a => a.capability === 'collapse') as CollapseAtom[];

  const inputAtoms = others.filter(a =>
    a.capability === 'drag' || a.capability === 'resize' || a.capability === 'scroll' || a.capability === 'click'
  ) as InputAtom[];

  const hasDrag = inputAtoms.some(a => a.capability === 'drag');
  const hasClick = inputAtoms.some(a => a.capability === 'click');
  const hasHoverTrigger = animationAtoms.some(a =>
    (a.capability === 'scale' || a.capability === 'opacity' || a.capability === 'rotate') &&
    (a as AnimationAtom).trigger === 'hover'
  );

  const trigger = useCallback((tid: string) => {
    setTriggers(prev => new Set([...prev, tid]));
  }, []);

  const untrigger = useCallback((tid: string) => {
    setTriggers(prev => {
      const next = new Set(prev);
      next.delete(tid);
      return next;
    });
  }, []);

  const startDrag = useCallback((did: string) => {
    setIsDragging(true);
    setDraggingId(did);
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const updateDragOffset = useCallback((offset: { x: number; y: number }) => {
    setDragOffset(offset);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (hasDrag) {
      e.preventDefault();
      startDrag(id);
      const startX = e.clientX, startY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        updateDragOffset({ x: moveEvent.clientX - startX, y: moveEvent.clientY - startY });
      };
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        endDrag();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [hasDrag, id, startDrag, updateDragOffset, endDrag]);

  const handleMouseEnter = useCallback(() => {
    if (hasHoverTrigger) trigger(`${id}-hover`);
  }, [hasHoverTrigger, id, trigger]);

  const handleMouseLeave = useCallback(() => {
    if (hasHoverTrigger) untrigger(`${id}-hover`);
  }, [hasHoverTrigger, id, untrigger]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasClick) {
      trigger(`${id}-click`);
      setTimeout(() => untrigger(`${id}-click`), 200);
    }

    if (globalState) {
      collapseAtoms.forEach(atom => {
        globalState.toggleCollapse(atom.group);
      });
    }
  }, [hasClick, id, trigger, untrigger, collapseAtoms, globalState]);

  const containerStyle: React.CSSProperties = {
    position: position ? 'absolute' : 'relative',
    left: position?.x,
    top: position?.y,
    zIndex: position?.z,
    display: 'inline-block',
    width: 'fit-content',
    minWidth: 100,
    minHeight: 30,
    overflow: 'hidden',
    transition: 'width 0.3s ease, height 0.3s ease',
  };

  decorationAtoms.forEach(atom => {
    if (atom.capability === 'background') {
      containerStyle.backgroundColor = `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`;
    }
    if (atom.capability === 'border') {
      containerStyle.border = `${atom.width}px solid rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`;
      if (atom.radius) {
        containerStyle.borderRadius = atom.radius;
      }
    }
    if (atom.capability === 'shadow') {
      containerStyle.boxShadow = `${atom.x}px ${atom.y}px ${atom.blur}px rgba(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]}, 0.25)`;
    }
  });

  const isHovered = triggers.has(`${id}-hover`);
  const isClicked = triggers.has(`${id}-click`);
  const isCurrentlyDragging = isDragging && draggingId === id;

  animationAtoms.forEach(atom => {
    if (atom.capability === 'scale') {
      const shouldApply = (atom.trigger === 'hover' && isHovered) ||
                          (atom.trigger === 'click' && isClicked) ||
                          (atom.trigger === 'drag' && isCurrentlyDragging);
      if (shouldApply) containerStyle.transform = `scale(${atom.value})`;
    }
    if (atom.capability === 'opacity') {
      const shouldApply = (atom.trigger === 'hover' && isHovered) ||
                          (atom.trigger === 'click' && isClicked) ||
                          (atom.trigger === 'drag' && isCurrentlyDragging);
      if (shouldApply) containerStyle.opacity = atom.value;
    }
    if (atom.capability === 'rotate') {
      const shouldApply = (atom.trigger === 'hover' && isHovered) ||
                          (atom.trigger === 'click' && isClicked);
      if (shouldApply) containerStyle.transform = `rotate(${atom.value}deg)`;
    }
    if (atom.capability === 'translate') {
      if (isCurrentlyDragging) {
        containerStyle.transform = `translate(${atom.x}px, ${atom.y}px)`;
      }
    }
  });

  heightAtoms.forEach(atom => {
    let targetValue: number;
    if (globalState) {
      const isCollapsed = globalState.isCollapsed(atom.capability + '-' + id);
      targetValue = isCollapsed ? (atom.collapsedValue ?? 0) : atom.value;
    } else {
      const shouldCollapse = (atom.trigger === 'click' && isClicked) || (atom.trigger === 'hover' && isHovered);
      targetValue = shouldCollapse ? (atom.collapsedValue ?? 0) : atom.value;
    }
    containerStyle.height = targetValue;
    localSizes[`height-${id}`] = targetValue;
  });

  widthAtoms.forEach(atom => {
    let targetValue: number;
    if (globalState) {
      const isCollapsed = globalState.isCollapsed(atom.capability + '-' + id);
      targetValue = isCollapsed ? (atom.collapsedValue ?? 0) : atom.value;
    } else {
      const shouldCollapse = (atom.trigger === 'click' && isClicked) || (atom.trigger === 'hover' && isHovered);
      targetValue = shouldCollapse ? (atom.collapsedValue ?? 0) : atom.value;
    }
    containerStyle.width = targetValue;
    localSizes[`width-${id}`] = targetValue;
  });

  if (globalState) {
    collapseAtoms.forEach(atom => {
      const isCollapsed = globalState.isCollapsed(atom.group);
      if (isCollapsed) {
        if (atom.collapsedValue !== undefined) {
          containerStyle.height = atom.collapsedValue;
        }
      } else {
        if (atom.expandedValue !== undefined) {
          containerStyle.height = atom.expandedValue;
        }
      }
    });
  }

  if (isCurrentlyDragging) {
    containerStyle.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
    containerStyle.cursor = 'grabbing';
  }

  return (
    <div
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {renderable.map((atom, index) => (
        <AtomRenderer key={index} atom={atom} />
      ))}
    </div>
  );
};
