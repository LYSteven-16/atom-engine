import type { AtomContext } from '../atoms';

export interface CollapseAtomConfig {
  id: string;
  group: string;
  expandedValue?: number;
  collapsedValue?: number;
}

export class CollapseAtom {
  readonly capability: 'collapse' = 'collapse';
  readonly context: AtomContext;
  readonly id: string;
  private element: HTMLElement;
  private config: CollapseAtomConfig;
  private currentHeight: string = 'auto';
  private isCollapsed: boolean = false;
  private collapsedGroups: Set<string>;

  constructor(context: AtomContext, element: HTMLElement, config: CollapseAtomConfig, collapsedGroups: Set<string>) {
    this.context = context;
    this.id = config.id;
    this.element = element;
    this.config = config;
    this.collapsedGroups = collapsedGroups;
    this.syncWithGroups();
  }

  syncWithGroups(): void {
    const isCollapsed = this.collapsedGroups.has(this.config.group);
    if (isCollapsed !== this.isCollapsed) {
      this.isCollapsed = isCollapsed;
      if (this.isCollapsed && this.config.collapsedValue !== undefined) {
        this.currentHeight = `${this.config.collapsedValue}px`;
      } else if (!this.isCollapsed && this.config.expandedValue !== undefined) {
        this.currentHeight = `${this.config.expandedValue}px`;
      } else {
        this.currentHeight = 'auto';
      }
      this.apply();
    }
  }

  toggle(): void {
    if (this.isCollapsed) {
      this.collapsedGroups.delete(this.config.group);
      this.isCollapsed = false;
      if (this.config.expandedValue !== undefined) {
        this.currentHeight = `${this.config.expandedValue}px`;
      } else {
        this.currentHeight = 'auto';
      }
    } else {
      this.collapsedGroups.add(this.config.group);
      this.isCollapsed = true;
      if (this.config.collapsedValue !== undefined) {
        this.currentHeight = `${this.config.collapsedValue}px`;
      } else {
        this.currentHeight = 'auto';
      }
    }
    this.apply();
  }

  private apply(): void {
    this.element.style.height = this.currentHeight;
  }

  getValue(): string {
    return this.currentHeight;
  }

  getIsCollapsed(): boolean {
    return this.isCollapsed;
  }

  getGroup(): string {
    return this.config.group;
  }
}