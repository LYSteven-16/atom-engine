# AtomEngine 架构文档

本文档详细描述 AtomEngine 的内部架构设计，帮助开发者理解引擎的工作原理，以便更好地使用、扩展和定制引擎。

## 架构概述

AtomEngine 是一个基于层级分解（Atomic Design）的纯 JavaScript 组件渲染引擎，采用数据驱动架构。引擎通过声明式配置生成复杂的交互式用户界面，无需依赖任何前端框架。

### 核心设计目标

1. **零依赖**：仅依赖原生 JavaScript 和 DOM API，可运行于任何现代浏览器
2. **数据驱动**：通过 JSON 配置声明界面，引擎自动处理 DOM 创建和交互
3. **原子化设计**：组件由原子组成，支持高度复用和组合
4. **可扩展性**：支持自定义原子类型，方便扩展功能

### 技术选型理由

**TypeScript**：
- 提供完整的类型系统，支持编译时检查
- 增强代码可读性和可维护性
- IDE 支持更好，提高开发效率

**ES Module + CommonJS 双格式输出**：
- ES Module 支持现代浏览器的原生模块加载
- CommonJS 支持 Node.js 环境和传统打包工具

**tsup 构建工具**：
- 基于 esbuild，速度极快
- 配置简单，支持 TypeScript 和 Bundle
- 内置 DTS 生成，支持类型声明

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SubstanceManager (物质管理器)            │    │
│  │  - 管理所有分子                                      │    │
│  │  - 处理布局计算                                      │    │
│  │  - 创建 BeakerManager 实例                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              BeakerManager (焙烤管理器)               │    │
│  │  - 管理所有 Beaker 实例                               │    │
│  │  - 提供 Baker 查询接口                                │    │
│  │  - 维护 Baker 状态快照                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│          ┌─────────────────┼─────────────────┐             │
│          ▼                 ▼                 ▼             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Beaker    │  │    Beaker    │  │    Beaker    │      │
│  │  (分子-1)     │  │  (分子-2)     │  │  (分子-N)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│          │                 │                 │             │
│          ▼                 ▼                 ▼             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      原子层                          │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │
│  │  │ 内容原子 │ │ 输入原子 │ │ 装饰原子 │ │ 动画原子 │       │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 架构分层

1. **应用层**：用户代码，定义分子配置
2. **管理层**：SubstanceManager、BeakerManager 管理组件生命周期
3. **组件层**：Beaker 表示分子的运行时实例
4. **原子层**：Atom 实现具体功能

## 核心组件详解

### 1. SubstanceManager (物质管理器)

**文件位置**：`/src/SubstanceManager.ts`

**职责**：
- 作为引擎的入口点
- 管理所有分子（Molecule）的配置
- 处理布局计算
- 创建和销毁 BeakerManager 实例

**关键属性**：
```typescript
private _beakerManager: BeakerManager;   // BeakerManager 实例
```

**关键方法**：

#### constructor(molecules: Molecule[])
```typescript
constructor(molecules: Molecule[]) {
  // 1. 处理分子配置（计算位置、网格等）
  const processedMolecules = this.process(molecules);

  // 2. 创建 BeakerManager 实例
  this._beakerManager = new BeakerManager(processedMolecules);
}
```

#### process(molecules: Molecule[], cellWidth?: number, cellHeight?: number): Molecule[]
```typescript
private process(molecules: Molecule[], cellWidth: number = 100, cellHeight: number = 100): Molecule[] {
  // 内部私有方法，处理分子布局计算
  
  // 1. 检查是否有 vertical 或 horizontal 属性
  const hasVerticalOrHorizontal = molecules.some(m =>
    m.vertical !== undefined || m.horizontal !== undefined
  );

  // 2. 如果没有网格属性，直接返回原始位置
  if (!hasVerticalOrHorizontal) {
    return molecules.map(molecule => ({
      ...molecule,
      position: molecule.position ?? { x: 0, y: 0 }
    }));
  }

  // 3. 为所有分子设置默认值
  const moleculesWithDefaults = molecules.map(molecule => ({
    ...molecule,
    vertical: molecule.vertical ?? 1,
    horizontal: molecule.horizontal ?? 1,
    verticalGap: molecule.verticalGap ?? 10,
    horizontalGap: molecule.horizontalGap ?? 10,
    position: molecule.position ?? { x: 0, y: 0 }
  }));

  // 4. 根据网格计算位置
  const defaultGap = 10;
  return moleculesWithDefaults.map(currentMolecule => {
    const hasVertical = currentMolecule.vertical !== undefined;
    const hasHorizontal = currentMolecule.horizontal !== undefined;
    const originalPosition = currentMolecule.position;

    let x: number;
    let y: number;

    if (hasVertical && !hasHorizontal) {
      y = (currentMolecule.vertical! - 1) * (cellHeight + (currentMolecule.verticalGap ?? defaultGap));
      x = originalPosition?.x ?? 0;
    } else if (hasHorizontal && !hasVertical) {
      x = (currentMolecule.horizontal! - 1) * (cellWidth + (currentMolecule.horizontalGap ?? defaultGap));
      y = originalPosition?.y ?? 0;
    } else {
      const row = Math.floor((currentMolecule.vertical! - 1));
      const col = currentMolecule.horizontal! - 1;
      x = col * (cellWidth + (currentMolecule.horizontalGap ?? defaultGap));
      y = row * (cellHeight + (currentMolecule.verticalGap ?? defaultGap));
    }

    return {
      ...currentMolecule,
      position: { x, y }
    };
  });
}
```

#### getBakerManager(): BeakerManager
```typescript
public getBakerManager(): BeakerManager {
  return this._beakerManager;
}
```

**使用示例**：
```typescript
const molecules = [
  {
    id: 'my-molecule',
    position: { x: 100, y: 100 },
    atoms: [...]
  }
];

const manager = new SubstanceManager(molecules);
// BeakerManager 会自动将 Baker 的 DOM 元素添加到 document.body
```

### 2. BeakerManager (焙烤管理器)

**文件位置**：`/src/BeakerManager.ts`

**职责**：
- 管理所有 Beaker 实例的生命周期
- 提供 Baker 查询接口
- 维护 Baker 状态快照

**关键属性**：
```typescript
private bakers: Map<string, Beaker>;           // Baker 实例映射
private bakerStates: Map<string, BakerState>;  // Baker 状态快照
private bakerIdCounter: number;                // Baker ID 计数器
```

**关键方法**：

#### constructor(molecules: Molecule[])
```typescript
constructor(molecules: Molecule[]) {
  // 1. 初始化属性
  this.bakers = new Map();
  this.bakerStates = new Map();
  this.bakerIdCounter = 0;

  // 2. 批量创建 Beaker 实例
  molecules.forEach((molecule) => {
    const bakerIndex = this.bakerIdCounter;
    const bakerId = `baker-${this.bakerIdCounter++}`;

    // 创建 Beaker 实例（Beaker 内部创建自己的 DOM 元素）
    const baker = new Beaker(bakerId, molecule, bakerIndex, this.handleBakerStateChange.bind(this));
    this.bakers.set(bakerId, baker);

    // 保存状态快照
    this.bakerStates.set(bakerId, baker.getState());

    // 将 Beaker 的 DOM 元素添加到 document.body
    document.body.appendChild(baker.element);
  });
}

private handleBakerStateChange(bakerId: string, state: Partial<BakerState>): void {
  const currentState = this.bakerStates.get(bakerId);
  if (currentState) {
    this.bakerStates.set(bakerId, { ...currentState, ...state });
  }
}
```

#### getBaker(id: string): Beaker | undefined
```typescript
getBaker(id: string): Beaker | undefined {
  return this.bakers.get(id);
}
```

#### getAllBakers(): Beaker[]
```typescript
getAllBakers(): Beaker[] {
  return Array.from(this.bakers.values());
}
```

#### getBakerState(id: string): BakerState | undefined
```typescript
getBakerState(id: string): BakerState | undefined {
  return this.bakerStates.get(id);
}
```

#### getAllBakerStates(): BakerState[]
```typescript
getAllBakerStates(): BakerState[] {
  return Array.from(this.bakerStates.values());
}
```

#### getBakerCount(): number
```typescript
getBakerCount(): number {
  return this.bakers.size;
}
```

**Baker ID 命名规则**：`baker-${counter}`，其中 counter 是 BeakerManager 内部的原子计数器，从 0 开始递增。第一个创建的 Baker ID 为 `baker-0`，第二个为 `baker-1`，以此类推。

### 3. Beaker (焙烤器)

**文件位置**：`/src/Beaker.ts`

**职责**：
- 表示分子的运行时实例
- 管理原子的创建和销毁
- 维护分子状态
- 应用装饰和动画

**关键属性**：
```typescript
public readonly id: string;                      // Baker 实例 ID
public readonly molecule: Molecule;             // 分子配置对象
public readonly element: HTMLElement;           // DOM 容器
public readonly bakerIndex: number;             // Baker 索引
public state: BakerState;                       // 当前状态
private triggers: Set<string> = new Set();      // 触发器集合
private onStateChange: StateChangeCallback | null; // 状态变更回调
private contentAtoms: any[] = [];               // 内容原子数组
private eventAtoms: any[] = [];                 // 事件原子数组
private resizeHandles: any[] = [];              // 调整大小手柄数组
private atomIndexCounter: number = 0;            // 原子索引计数器
```

**BakerState 接口**：
```typescript
interface BakerState {
  id: string;                           // 状态 ID
  moleculeId: string;                  // 关联的分子 ID
  isHovered: boolean;                   // 是否悬停
  isClicked: boolean;                   // 是否点击
  isDragging: boolean;                  // 是否拖拽中
  isResizing: boolean;                  // 是否调整大小中
  position: { x: number; y: number };  // 位置
  width?: number;                       // 宽度（可选）
  height?: number;                       // 高度（可选）
  scrollX?: number;                     // 水平滚动位置（可选）
  scrollY?: number;                     // 垂直滚动位置（可选）
  collapsedGroups: Set<string>;          // 折叠组状态（用于 CollapseAtom）
}
```

**关键方法**：

#### constructor(id: string, molecule: Molecule, bakerIndex: number, onStateChange?: StateChangeCallback)
```typescript
constructor(id: string, molecule: Molecule, bakerIndex: number, onStateChange?: StateChangeCallback) {
  this.id = id;
  this.bakerIndex = bakerIndex;
  this.molecule = molecule;
  this.onStateChange = onStateChange || null;

  // 创建 DOM 容器
  this.element = document.createElement('div');
  this.element.id = `beaker-${molecule.id}`;
  this.element.style.position = 'absolute';
  if (molecule.position) {
    this.element.style.left = `${molecule.position.x}px`;
    this.element.style.top = `${molecule.position.y}px`;
  }
  this.element.style.overflow = 'visible';
  this.element.style.background = 'transparent';
  this.element.style.border = 'none';
  this.element.style.outline = 'none';
  this.element.style.boxShadow = 'none';
  this.element.style.cursor = 'default';

  // 初始化状态
  this.state = {
    id: this.id,
    moleculeId: molecule.id,
    isHovered: false,
    isClicked: false,
    isDragging: false,
    isResizing: false,
    position: { ...(molecule.position ?? { x: 0, y: 0 }) },
    width: undefined,
    height: undefined,
    scrollX: 0,
    scrollY: 0,
    collapsedGroups: new Set()
  };

  // 初始化
  this.init();
}
```

#### init()
```typescript
init(): void {
  // 1. 获取原子配置
  const atoms = [...(this.molecule.atoms || [])];

  // 2. 根据 capability 分类原子
  const contentCapabilities = ['text', 'image', 'video', 'audio', 'code', 'icon', 'canvas'];
  const eventCapabilities = ['drag', 'resize', 'scroll', 'click', 'hover'];
  const decorationCapabilities = ['background', 'border', 'shadow'];
  const animationCapabilities = ['scale', 'opacity', 'rotate', 'translate', 'height', 'width', 'collapse'];

  const contentAtoms = atoms.filter(a => contentCapabilities.includes(a.capability));
  const decorationAtoms = atoms.filter(a => decorationCapabilities.includes(a.capability));
  const animationAtoms = atoms.filter(a => animationCapabilities.includes(a.capability));

  // 3. 计算容器尺寸
  const calculatedSize = this.calculateContainerSize(contentAtoms);
  let width = this.molecule.width ?? calculatedSize.width;
  let height = this.molecule.height ?? calculatedSize.height;

  // 4. 设置容器尺寸
  this.element.style.width = `${width}px`;
  this.element.style.height = `${height}px`;
  this.state.width = width;
  this.state.height = height;

  // 5. 应用装饰
  this.applyDecorations(decorationAtoms);

  // 6. 创建内容原子
  this.createContentAtoms(contentAtoms);

  // 7. 创建事件原子
  this.createEventAtoms(atoms.filter(a => eventCapabilities.includes(a.capability)), animationAtoms);

  // 8. 创建调整大小手柄
  this.createResizeHandles(atoms.filter(a => a.capability === 'resize-handle'));
}
```

#### updateState(newState: Partial<BakerState>): void
```typescript
public updateState(newState: Partial<BakerState>): void {
  this.state = { ...this.state, ...newState };
  if (this.onStateChange) {
    this.onStateChange(this.id, newState);
  }
}
```

#### getState(): BakerState
```typescript
public getState(): BakerState {
  return { ...this.state };
}
```

#### updatePosition(x: number, y: number): void
```typescript
public updatePosition(x: number, y: number): void {
  this.state.position = { x, y };
  this.element.style.left = `${x}px`;
  this.element.style.top = `${y}px`;
  if (this.onStateChange) {
    this.onStateChange(this.id, { position: { x, y } });
  }
}
```

#### calculateContainerSize(atoms: any[]): { width: number; height: number }
```typescript
private calculateContainerSize(atoms: any[]): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;

  atoms.forEach(atom => {
    const x = atom.position?.x ?? 0;
    const y = atom.position?.y ?? 0;

    let atomWidth = 0;
    let atomHeight = 0;

    switch (atom.capability) {
      case 'text':
        atomWidth = (atom.text?.length ?? 0) * (atom.size ?? 16) * 0.6 + 20;
        atomHeight = (atom.size ?? 16) + 10;
        break;
      case 'image':
        atomWidth = atom.width || 100;
        atomHeight = atom.height || 100;
        break;
      case 'video':
        atomWidth = atom.width || 300;
        atomHeight = atom.height || 200;
        break;
      case 'audio':
        atomWidth = 200;
        atomHeight = 40;
        break;
      case 'code':
        atomWidth = 300;
        atomHeight = 150;
        break;
      case 'icon':
        atomWidth = atom.size || 24;
        atomHeight = atom.size || 24;
        break;
      case 'canvas':
        atomWidth = atom.width || 100;
        atomHeight = atom.height || 100;
        break;
    }

    maxX = Math.max(maxX, x + atomWidth);
    maxY = Math.max(maxY, y + atomHeight);
  });

  const padding = 0;
  return {
    width: Math.max(maxX + padding, 50),
    height: Math.max(maxY + padding, 30)
  };
}
```

#### applyDecorations(atoms: any[]): void
```typescript
private applyDecorations(atoms: any[]): void {
  const backgroundAtom = atoms.find(a => a.capability === 'background') as any;
  const borderAtom = atoms.find(a => a.capability === 'border') as any;
  const shadowAtom = atoms.find(a => a.capability === 'shadow') as any;

  const moleculeRadius = (this.molecule as any).radius;
  let radius = moleculeRadius ?? backgroundAtom?.radius ?? borderAtom?.radius ?? shadowAtom?.radius ?? 0;

  if (backgroundAtom) {
    this.element.style.background = `rgb(${backgroundAtom.color[0]}, ${backgroundAtom.color[1]}, ${backgroundAtom.color[2]})`;
    if (radius > 0) this.element.style.borderRadius = `${radius}px`;
  }

  if (borderAtom) {
    this.element.style.border = `${borderAtom.width}px solid rgb(${borderAtom.color[0]}, ${borderAtom.color[1]}, ${borderAtom.color[2]})`;
    if (radius > 0) this.element.style.borderRadius = `${radius}px`;
  }

  if (shadowAtom) {
    const blur = shadowAtom.blur ?? 0;
    const x = shadowAtom.x ?? 0;
    const y = shadowAtom.y ?? 0;
    const color = shadowAtom.color;
    this.element.style.boxShadow = `${x}px ${y}px ${blur}px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
    if (radius > 0) this.element.style.borderRadius = `${radius}px`;
  }
}
```

#### createContext(): AtomContext
```typescript
private createContext(): { bakerId: string; bakerIndex: number; atomIndex: number } {
  return {
    bakerId: this.id,
    bakerIndex: this.bakerIndex,
    atomIndex: this.atomIndexCounter++
  };
}
```

#### createContentAtoms(atoms: any[]): void
```typescript
private createContentAtoms(atoms: any[]): void {
  atoms.forEach(atomConfig => {
    const context = this.createContext();

    try {
      switch (atomConfig.capability) {
        case 'text':
          this.contentAtoms.push(new Atoms.TextAtom(context, this.element, {
            text: atomConfig.text,
            size: atomConfig.size,
            color: atomConfig.color,
            position: atomConfig.position
          }));
          break;
        case 'image':
          this.contentAtoms.push(new Atoms.ImageAtom(context, this.element, {
            src: atomConfig.src,
            width: atomConfig.width,
            height: atomConfig.height,
            alt: atomConfig.alt,
            position: atomConfig.position,
            fitMode: atomConfig.fitMode,
            offsetX: atomConfig.offsetX,
            offsetY: atomConfig.offsetY
          }));
          break;
        case 'video':
          this.contentAtoms.push(new Atoms.VideoAtom(context, this.element, {
            src: atomConfig.src,
            width: atomConfig.width,
            height: atomConfig.height,
            position: atomConfig.position
          }));
          break;
        case 'audio':
          this.contentAtoms.push(new Atoms.AudioAtom(context, this.element, {
            src: atomConfig.src,
            position: atomConfig.position,
            width: atomConfig.width,
            height: atomConfig.height,
            autoplay: atomConfig.autoplay,
            loop: atomConfig.loop,
            muted: atomConfig.muted
          }));
          break;
        case 'code':
          this.contentAtoms.push(new Atoms.CodeAtom(context, this.element, {
            code: atomConfig.code,
            language: atomConfig.language,
            position: atomConfig.position
          }));
          break;
        case 'icon':
          this.contentAtoms.push(new Atoms.IconAtom(context, this.element, {
            icon: atomConfig.icon,
            size: atomConfig.size,
            position: atomConfig.position
          }));
          break;
        case 'canvas':
          this.contentAtoms.push(new Atoms.CanvasAtom(context, this.element, {
            width: atomConfig.width,
            height: atomConfig.height,
            position: atomConfig.position,
            strokeColor: atomConfig.strokeColor,
            strokeWidth: atomConfig.strokeWidth,
            backgroundColor: atomConfig.backgroundColor,
            blackboardStyle: atomConfig.blackboardStyle,
            defaultColors: atomConfig.defaultColors,
            defaultWidths: atomConfig.defaultWidths,
            showToolbar: atomConfig.showToolbar,
            resizable: atomConfig.resizable,
            minWidth: atomConfig.minWidth,
            minHeight: atomConfig.minHeight
          }));
          break;
      }
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建ContentAtom失败:`, error);
    }
  });
}
```

#### getState(): BakerState
```typescript
getState(): BakerState {
  return this.state;
}
```

#### updateState(newState: Partial<BakerState>): void
```typescript
updateState(newState: Partial<BakerState>): void {
  this.state = { ...this.state, ...newState };
  if (this.onStateChange) {
    this.onStateChange(this.id, newState);
  }
}
```

#### destroy() [TODO]
```typescript
// 注意：此方法尚未实现，计划在后续版本中添加
// 预期功能：
// destroy(): void {
//   // 1. 销毁所有原子
//   this.atoms.clear();
//
//   // 2. 移除事件监听
//
//   // 3. 从 DOM 中移除容器
//   this.element.remove();
// }
```

### 4. Molecule (分子)

**文件位置**：`/src/molecules.ts`

**接口定义**：
```typescript
export interface Molecule {
  id: string;                                      // 唯一标识符（必需）
  position?: { x: number; y: number; z?: number }; // 位置
  vertical?: number;                               // 垂直网格行数
  horizontal?: number;                              // 水平网格列数
  verticalGap?: number;                            // 垂直间距
  horizontalGap?: number;                           // 水平间距
  atoms: any[];                                   // 原子数组
  width?: number | string;                         // 宽度
  height?: number | string;                         // 高度
  radius?: number;                                  // 圆角
}
```

### 5. Atom (原子)

**文件位置**：`/src/atoms.ts`

**接口定义**：
```typescript
// 装饰原子接口
export interface BackgroundAtom {
  capability: 'background';
  context: AtomContext;
  color: [number, number, number];
  width?: number;
  height?: number;
  radius?: number;
}

export interface BorderAtom {
  capability: 'border';
  context: AtomContext;
  width: number;
  color: [number, number, number];
  radius?: number;
}

export interface ShadowAtom {
  capability: 'shadow';
  context: AtomContext;
  x: number;
  y: number;
  blur: number;
  color: [number, number, number];
}

// 动画原子接口
export interface ScaleAtom {
  capability: 'scale';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click';
  duration?: number;
}

export interface OpacityAtom {
  capability: 'opacity';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click';
  duration?: number;
}

export interface RotateAtom {
  capability: 'rotate';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click';
  duration?: number;
}

export interface TranslateAtom {
  capability: 'translate';
  context: AtomContext;
  x: number;
  y: number;
  trigger: 'drag';
  duration?: number;
}

export interface HeightAtom {
  capability: 'height';
  context: AtomContext;
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
  duration?: number;
}

export interface WidthAtom {
  capability: 'width';
  context: AtomContext;
  value: number;
  trigger: 'click' | 'hover';
  collapsedValue?: number;
  duration?: number;
}

export interface CollapseAtom {
  capability: 'collapse';
  context: AtomContext;
  group: string;
  expandedValue?: number;
  collapsedValue?: number;
  duration?: number;
}
```

## 数据流

### 初始化数据流

```
用户配置 (Molecule[])
    │
    ▼
SubstanceManager.process()
    │
    ▼
BeakerManager.createBaker()
    │
    ├── 创建 DOM 容器
    ├── 设置位置和尺寸
    └── 创建 Beaker 实例
    │
    ▼
Beaker.init()
    │
    ├── updateContainerSize()
    ├── createAtoms()
    ├── applyDecorators()
    ├── applyAnimations()
    └── setupEventListeners()
    │
    ▼
DOM 渲染完成
```

### 状态更新数据流

```
用户交互 (点击、拖拽等)
    │
    ▼
事件监听器触发
    │
    ▼
Baker.updateState({ ... })
    │
    ├── 更新 state 对象
    ├── 更新 DOM 样式
    └── 触发重新渲染
    │
    ▼
界面更新完成
```

### 布局计算数据流

```
SubstanceManager.process()
    │
    ▼
calculateLayout()
    │
    ├── 遍历所有分子
    ├── 计算网格位置
    └── 应用间距
    │
    ▼
BeakerManager 重新创建
    │
    ▼
所有 Baker 重新初始化
```

## 原子系统

### 原子分类

#### 1. 内容原子 (Content Atom)

负责显示内容，包括：

| 原子类型 | 文件位置 | 功能描述 |
|---------|---------|---------|
| TextAtom | `/src/atoms/TextAtom.ts` | 显示文本内容 |
| ImageAtom | `/src/atoms/ImageAtom.ts` | 显示图片（支持滚动/裁切/拉伸模式） |
| VideoAtom | `/src/atoms/VideoAtom.ts` | 播放视频 |
| AudioAtom | `/src/atoms/AudioAtom.ts` | 播放音频 |
| CodeAtom | `/src/atoms/CodeAtom.ts` | 显示代码 |
| IconAtom | `/src/atoms/IconAtom.ts` | 显示图标 |
| CanvasAtom | `/src/atoms/CanvasAtom.ts` | 绘图画布 |

#### 2. 输入原子 (Input Atom)

负责处理用户交互，包括：

| 原子类型 | 文件位置 | 功能描述 |
|---------|---------|---------|
| ClickAtom | `/src/atoms/ClickAtom.ts` | 点击事件 |
| DragAtom | `/src/atoms/DragAtom.ts` | 拖拽功能 |
| HoverAtom | `/src/atoms/HoverAtom.ts` | 悬停事件 |
| ResizeAtom | `/src/atoms/ResizeAtom.ts` | 调整大小 |
| ResizeHandleAtom | `/src/atoms/ResizeHandleAtom.ts` | 调整把手 |
| ScrollAtom | `/src/atoms/ScrollAtom.ts` | 滚动事件 |

#### 3. 装饰原子 (Decoration Atom)

负责视觉样式，包括：

| 原子类型 | capability | 功能描述 |
|---------|---------|---------|
| BackgroundAtom | `background` | 背景样式（实现于 `/src/Beaker.ts` 的 `applyDecorations` 方法） |
| BorderAtom | `border` | 边框样式（实现于 `/src/Beaker.ts` 的 `applyDecorations` 方法） |
| ShadowAtom | `shadow` | 阴影样式（实现于 `/src/Beaker.ts` 的 `applyDecorations` 方法） |

注意：装饰原子没有单独的文件，直接在`Beaker.ts`的`applyDecorations`方法中实现。

#### 4. 动画原子 (Animation Atom)

负责动画效果，包括：

| 原子类型 | capability | 功能描述 |
|---------|---------|---------|
| ScaleAtom | `scale` | 缩放动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |
| OpacityAtom | `opacity` | 透明度动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |
| RotateAtom | `rotate` | 旋转动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |
| TranslateAtom | `translate` | 平移动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |
| HeightAtom | `height` | 高度动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |
| WidthAtom | `width` | 宽度动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |
| CollapseAtom | `collapse` | 折叠动画（实现于 `/src/Beaker.ts` 的 `applyAnimations` 方法） |

注意：动画原子没有单独的文件，直接在`Beaker.ts`的`applyAnimations`方法中实现。

### 原子创建流程

```
Beaker.createAtoms()
    │
    ▼
遍历 atoms 数组
    │
    ▼
根据 atom.capability 匹配
    │
    ├── 'text'    → new Atoms.TextAtom()
    ├── 'image'    → new Atoms.ImageAtom()
    ├── 'video'    → new Atoms.VideoAtom()
    └── ... 其他类型
    │
    ▼
调用对应的 create* 方法
    │
    ├── 创建 DOM 元素
    ├── 应用配置
    ├── 设置位置
    └── 添加到容器
```

### 原子更新流程

```
Baker.updateState()
    │
    ▼
状态变化触发
    │
    ▼
遍历所有原子
    │
    ▼
检查需要更新的原子
    │
    ├── TextAtom 配置变化 → 重新设置 textContent
    ├── 位置变化 → 重新设置 style.left/top
    └── 尺寸变化 → 重新设置 style.width/height
    │
    ▼
DOM 更新完成
```

## 关键算法

### 1. 布局计算算法

**目的**：计算分子的位置

**输入**：分子配置数组

**输出**：计算后的位置信息

**算法**：
```
for each molecule in molecules:
    if molecule.position is not set:
        // 使用网格计算
        x = (molecule.horizontal || 1) * (cellWidth + horizontalGap)
        y = (molecule.vertical || 1) * (cellHeight + verticalGap)
        molecule.position = { x, y }

    // 应用间距
    molecule.position.x += (molecule.horizontalGap || defaultGap) * index
    molecule.position.y += (molecule.verticalGap || defaultGap) * index
```

**复杂度**：O(n)，n 为分子数量

### 2. 原子渲染算法

**目的**：创建和管理 DOM 元素

**输入**：原子配置

**输出**：渲染的 DOM 元素

**算法**：
```
createAtom(atom, context, container):
    switch (atom.capability):
        case 'text':
            element = document.createElement('div')
            element.textContent = atom.text
            element.style.fontSize = atom.size + 'px'
            element.style.color = `rgb(${atom.color.join(',')})`
        case 'image':
            element = document.createElement('img')
            element.src = atom.src
            element.width = atom.width
            element.height = atom.height
        // ... 其他原子类型

    // 应用基础样式
    if (atom.position):
        element.style.position = 'absolute'
        element.style.left = atom.position.x + 'px'
        element.style.top = atom.position.y + 'px'

    // 添加到父容器
    container.appendChild(element)
```

**复杂度**：O(1)，每个原子创建为常量时间

### 3. 状态管理算法

**目的**：管理和更新 Baker 状态

**输入**：状态更新对象

**输出**：更新后的状态

**算法**：
```
updateState(newState):
    // 1. 合并状态
    for each key in partial:
        state[key] = partial[key]

    // 2. 应用到 DOM
    if partial.position:
        container.style.left = state.position.x
        container.style.top = state.position.y

    if partial.width:
        container.style.width = state.width

    if partial.height:
        container.style.height = state.height

    // 3. 触发重新渲染
    triggerRerender()
```

**复杂度**：O(1)，状态更新为常量时间

## 扩展机制

### 自定义原子

引擎支持添加自定义原子类型：

```typescript
// 1. 定义原子配置接口
interface CustomAtomConfig {
  customProperty: string;
  onCustomEvent: () => void;
}

// 2. 实现原子创建逻辑
class CustomAtom {
  static create(id: string, config: CustomAtomConfig, container: HTMLElement) {
    const element = document.createElement('div');
    element.id = id;
    element.textContent = config.customProperty;

    // 应用配置
    element.style.backgroundColor = 'blue';
    element.style.color = 'white';
    element.style.padding = '10px';

    // 绑定事件
    element.addEventListener('click', config.onCustomEvent);

    // 添加到容器
    container.appendChild(element);

    return {
      element,
      update(newConfig: CustomAtomConfig) {
        element.textContent = newConfig.customProperty;
      },
      destroy() {
        element.remove();
      }
    };
  }
}

// 3. 在 Beaker 中添加支持
private createCustomAtom(id: string, config: CustomAtomConfig): void {
  const atom = CustomAtom.create(id, config, this.element);
  this.atoms.set(id, atom);
}
```

### 自定义装饰器

```typescript
interface CustomDecoratorConfig {
  customStyle: string;
}

// 实现自定义装饰器
function applyCustomDecorator(element: HTMLElement, config: CustomDecoratorConfig) {
  element.style.filter = config.customStyle;
}

// 在 Beaker.applyDecorators 中添加
if (decorator.type === 'CustomDecorator') {
  this.applyCustomDecorator(this.element, decorator.config);
}
```

### 自定义动画

```typescript
interface CustomAnimationConfig {
  customProperty: number;
  duration: number;
}

// 实现自定义动画
function applyCustomAnimation(element: HTMLElement, config: CustomAnimationConfig) {
  element.style.transition = `customProperty ${config.duration}ms`;

  requestAnimationFrame(() => {
    element.style.customProperty = config.customProperty;
  });
}

// 在 Beaker.applyAnimations 中添加
if (animation.type === 'CustomAnimation') {
  this.applyCustomAnimation(this.element, animation.config);
}
```

## 文件结构

```
/Users/liuyulin/atom-engine/
├── src/
│   ├── SubstanceManager.ts      # 物质管理器（入口类）
│   ├── BeakerManager.ts         # 焙烤管理器
│   ├── Beaker.ts                # 焙烤器（包含装饰原子和动画原子的实现）
│   ├── molecules.ts             # 分子类型定义
│   ├── atoms.ts                 # 原子类型定义
│   └── atoms/
│       ├── index.ts             # 原子导出
│       ├── TextAtom.ts          # 文本原子
│       ├── ImageAtom.ts         # 图片原子
│       ├── VideoAtom.ts         # 视频原子
│       ├── AudioAtom.ts         # 音频原子
│       ├── CodeAtom.ts          # 代码原子
│       ├── IconAtom.ts          # 图标原子
│       ├── CanvasAtom.ts        # 画布原子
│       ├── ClickAtom.ts         # 点击原子
│       ├── DragAtom.ts          # 拖拽原子
│       ├── HoverAtom.ts         # 悬停原子
│       ├── ResizeAtom.ts        # 调整大小原子
│       ├── ResizeHandleAtom.ts  # 调整把手原子
│       └── ScrollAtom.ts        # 滚动原子
├── demo/
│   └── index.html               # 示例页面
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 配置
├── README.md                    # 使用文档
└── ARCHITECTURE.md              # 架构文档
```

## 构建配置

### package.json

```json
{
  "name": "@component-chemistry/atom-engine",
  "version": "3.0.0",
  "main": "dist/SubstanceManager.js",       # CommonJS 入口
  "module": "dist/SubstanceManager.mjs",     # ES Module 入口
  "types": "dist/SubstanceManager.d.ts",     # 类型声明入口
  "scripts": {
    "build": "tsup src/SubstanceManager.ts --format cjs,esm --dts",
    "dev": "tsup src/SubstanceManager.ts --format cjs,esm --dts --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

**构建说明**：
- `main`：Node.js 环境使用的 CommonJS 格式，入口文件为 `dist/SubstanceManager.js`
- `module`：浏览器环境使用的 ES Module 格式，入口文件为 `dist/SubstanceManager.mjs`
- `types`：TypeScript 类型声明文件，类型文件为 `dist/SubstanceManager.d.ts`
- 构建输出文件名基于源文件名 `SubstanceManager.ts`，因此所有输出文件都以 `SubstanceManager` 开头

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",           // 编译目标
    "module": "ESNext",            // 模块系统
    "lib": ["ES2020", "DOM"],      // 类型库
    "strict": true,                // 严格模式
    "noImplicitAny": true,         // 禁止隐式 any
    "strictNullChecks": true       // 严格空检查
  }
}
```

## 性能优化

### 1. DOM 操作优化

**批量创建**：
```typescript
// 使用 DocumentFragment 批量添加
const fragment = document.createDocumentFragment();
atoms.forEach(atom => {
  fragment.appendChild(atom.element);
});
container.appendChild(fragment);
```

**按需更新**：
```typescript
// 只更新变化的属性
if (newConfig.text !== oldConfig.text) {
  element.textContent = newConfig.text;
}
```

### 2. 事件处理优化

**事件委托**：
```typescript
// 在容器上监听，而不是每个原子
container.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (target.dataset.atomType === 'ButtonAtom') {
    handleButtonClick(target);
  }
});
```

**节流/防抖**：
```typescript
// 拖拽事件节流
let lastDragTime = 0;
container.addEventListener('mousemove', (event) => {
  const now = Date.now();
  if (now - lastDragTime < 16) return; // 约 60fps
  lastDragTime = now;
  handleDrag(event);
});
```

### 3. 渲染优化

**CSS 变换**：
```typescript
// 使用 transform 而非 top/left
element.style.transform = `translate(${x}px, ${y}px)`;
```

**will-change 提示**：
```typescript
element.style.willChange = 'transform';
```

## 错误处理

### 1. 原子类型验证

```typescript
private createAtom(atom: Atom): void {
  const validCapabilities = [
    'text', 'image', 'video', 'audio', 'code', 'icon',
    'canvas', 'background', 'border', 'shadow',
    'click', 'drag', 'hover', 'resize', 'resize-handle', 'scroll',
    'scale', 'opacity', 'rotate', 'translate', 'width', 'height', 'collapse'
  ];

  if (!validCapabilities.includes(atom.capability)) {
    console.warn(`Unknown atom capability: ${atom.capability}`);
    return;
  }
}
```

### 2. 配置验证

```typescript
private validateMolecule(molecule: Molecule): boolean {
  if (!molecule.id) {
    console.error('Molecule must have an id');
    return false;
  }

  if (!molecule.atoms || !Array.isArray(molecule.atoms)) {
    console.error('Molecule must have an atoms array');
    return false;
  }

  return true;
}
```

### 3. 状态恢复

```typescript
try {
  this.createAtoms(molecule.atoms);
} catch (error) {
  console.error('Failed to create atoms:', error);
  // 恢复到初始状态
  this.state = this.createInitialState();
}
```

## 安全性考虑

### 1. XSS 防护

```typescript
// 使用 textContent 而非 innerHTML
element.textContent = sanitize(userInput);
```

### 2. 输入验证

```typescript
// 验证位置值
const x = Math.max(0, Math.min(parseInt(config.x), maxWidth));
const y = Math.max(0, Math.min(parseInt(config.y), maxHeight));
```

### 3. 边界检查

```typescript
// 拖拽边界限制
let newX = event.clientX - offsetX;
newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX));
```

## 测试策略

### 单元测试

```typescript
describe('Beaker', () => {
  it('should create container with correct position', () => {
    const container = document.createElement('div');
    const baker = new Beaker('test-id', 'test-molecule', container);

    baker.updateState({ position: { x: 100, y: 200 } });

    expect(container.style.left).toBe('100px');
    expect(container.style.top).toBe('200px');
  });
});
```

### 集成测试

```typescript
describe('SubstanceManager', () => {
  it('should create all bakers', () => {
    const molecules = [
      { id: 'm1', atoms: [] },
      { id: 'm2', atoms: [] }
    ];

    const manager = new SubstanceManager(molecules);
    const bakerManager = manager.getBakerManager();

    expect(bakerManager.getBakerCount()).toBe(2);
  });
});
```

## 浏览器兼容

### 支持的浏览器

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 使用的 API

- DOM API (createElement, appendChild, etc.)
- CSS Object Model
- Pointer Events
- Custom Events
- ES2020 Features (Optional Chaining, Nullish Coalescing)

## 未来架构演进

### 1. 虚拟化列表

对于大量分子的场景，可以引入虚拟化技术，只渲染可视区域内的分子。

### 2. 状态管理增强

考虑集成状态管理库（如 Redux 或 MobX），提供更强大的状态管理能力。

### 3. 服务端渲染

增加 SSR 支持，提高首屏加载性能。

### 4. 懒加载原子

支持原子按需加载，减少初始包体积。

## 附录

### A. 核心类型定义

```typescript
// atoms.ts 中的完整类型定义
export interface AtomContext {
  bakerId: string;
  bakerIndex: number;
  atomIndex: number;
}

export type Atom =
  | ContentAtom
  | InputAtom
  | DecorationAtom
  | AnimationAtom;

export interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };
  vertical?: number;
  horizontal?: number;
  verticalGap?: number;
  horizontalGap?: number;
  atoms: any[];
  width?: number;
  height?: number;
  radius?: number;
}

export interface BakerState {
  id: string;
  moleculeId: string;
  isHovered: boolean;
  isClicked: boolean;
  isDragging: boolean;
  isResizing: boolean;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  scrollX?: number;
  scrollY?: number;
  collapsedGroups: Set<string>;
}
```

### B. 常量定义

```typescript
const DEFAULT_CELL_WIDTH = 100;
const DEFAULT_CELL_HEIGHT = 100;
const DEFAULT_VERTICAL_GAP = 10;
const DEFAULT_HORIZONTAL_GAP = 10;
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_BORDER_WIDTH = 1;
const DEFAULT_BORDER_RADIUS = 4;
const DEFAULT_SHADOW_BLUR = 4;
```

### C. 命名约定

- **类名**：PascalCase（如 `SubstanceManager`、`BeakerManager`）
- **方法名**：camelCase（如 `createBaker`、`applyDecorators`）
- **私有方法**：以下划线开头（如 `_createInitialState`、`_createAtoms`）
- **常量**：UPPER_SNAKE_CASE（如 `DEFAULT_CELL_WIDTH`）
- **接口名**：PascalCase（如 `Molecule`、`BakerState`）
- **类型别名**：PascalCase（如 `ContentAtom`、`InputAtom`）

### D. 注释规范

```typescript
/**
 * 物质管理器类
 * 负责管理所有分子和布局计算
 *
 * @class SubstanceManager
 * @example
 * const manager = new SubstanceManager(molecules);
 * document.body.appendChild(manager.getBakerManager().getBakerManagerContainer());
 */
class SubstanceManager {
  /**
   * 处理分子配置
   * @param molecules - 分子配置数组
   * @returns void
   */
  process(molecules: Molecule[]): void {
    // ...
  }
}
```
