import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BeakerManager } from './BeakerManager';
import type { Molecule } from './AtomRenderer';

interface GlobalState {
  collapseStates: Record<string, boolean>;
  toggleCollapse: (groupId: string) => void;
  isCollapsed: (groupId: string) => boolean;
  setCollapsed: (groupId: string, collapsed: boolean) => void;
}

const GlobalStateContext = createContext<GlobalState | null>(null);

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within AtomEngine');
  }
  return context;
};

interface AtomEngineProps {
  molecule: Molecule;
}

export const AtomEngine: React.FC<AtomEngineProps> = ({ molecule }) => {
  const [collapseStates, setCollapseStates] = useState<Record<string, boolean>>({});

  const toggleCollapse = useCallback((groupId: string) => {
    setCollapseStates(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const isCollapsed = useCallback((groupId: string) => {
    return collapseStates[groupId] ?? false;
  }, [collapseStates]);

  const setCollapsed = useCallback((groupId: string, collapsed: boolean) => {
    setCollapseStates(prev => ({
      ...prev,
      [groupId]: collapsed,
    }));
  }, []);

  const globalState = useMemo<GlobalState>(() => ({
    collapseStates,
    toggleCollapse,
    isCollapsed,
    setCollapsed,
  }), [collapseStates, toggleCollapse, isCollapsed, setCollapsed]);

  return (
    <GlobalStateContext.Provider value={globalState}>
      <BeakerManager molecule={molecule} />
    </GlobalStateContext.Provider>
  );
};

export { BeakerManager } from './BeakerManager';
