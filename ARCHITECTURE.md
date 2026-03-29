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
│  │              BeakerManager (物质管理器)            │    │
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
2. **管理层**：BeakerManager、BeakerManager 管理组件生命周期
3. **组件层**：Beaker 表示分子的运行时实例
4. **原子层**：Atom 实现具体功能

## 核心组件详解

### 1. BeakerManager (物质管理器)

**文件位置**：`/src/BeakerManager.ts`

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

const manager = new BeakerManager(molecules);
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
private onStateChange: StateChangeCallback | null; // 状态变更回调
private contentAtoms: any[] = [];               // 内容原子数组
private atomIndexCounter: number = 0;            // 原子索引计数器
private animationAtoms: {
  scale?: ScaleAtom;
  opacity?: OpacityAtom;
  rotate?: RotateAtom;
  translate?: TranslateAtom;
  height?: HeightAtom;
  width?: WidthAtom;
  collapse?: CollapseAtom[];
} = {};
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
  this.element.style.border = 'transparent';
  this.element.style.outline = 'transparent';
  this.element.style.boxShadow = 'transparent';
  this.element.style.cursor = 'default';

  // 初始化状态
  this.state = this.createInitialState(molecule);

  // 初始化
  this.init();
}
```

#### init()
```typescript
private init(): void {
  // 1. 获取原子配置
  const atoms = [...(this.molecule.atoms || [])];

  // 2. 根据 capability 分类原子
  const contentCapabilities = ['text', 'image', 'video', 'audio', 'code', 'icon', 'canvas'];
  const decorationCapabilities = ['background', 'border', 'shadow'];
  const animationCapabilities = ['scale', 'opacity', 'rotate', 'translate', 'height', 'width', 'collapse'];

  const contentAtoms = atoms.filter(a => contentCapabilities.includes(a.capability));
  const decorationAtoms = atoms.filter(a => decorationCapabilities.includes(a.capability)) as any[];
  const animationAtomConfigs = atoms.filter(a => animationCapabilities.includes(a.capability)) as any[];

  // 3. 设置动画过渡
  const userDuration = animationAtomConfigs.find(a => a.duration !== undefined)?.duration;
  const duration = userDuration !== undefined ? userDuration : 0;
  this.element.style.transition = `width ${duration}s ease, height ${duration}s ease, transform ${duration}s ease, opacity ${duration}s ease`;

  // 4. 计算容器尺寸
  const calculatedSize = this.calculateContainerSize(contentAtoms);
  let width = this.molecule.width ?? calculatedSize.width;
  let height = this.molecule.height ?? calculatedSize.height;

  // 5. 设置容器尺寸
  this.element.style.width = `${width}px`;
  this.element.style.height = `${height}px`;
  this.state.width = width;
  this.state.height = height;

  // 6. 创建装饰原子（底层）
  this.createDecorationAtoms(decorationAtoms, this.molecule.width, this.molecule.height);

  // 7. 创建内容原子（上层）
  this.createContentAtoms(contentAtoms);

  // 8. 创建动画原子
  this.createAnimationAtoms(animationAtomConfigs);

  // 9. 创建输入原子
  this.createInputAtoms(atoms);

  // 10. 创建调整大小手柄
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
  if (this.animationAtoms.translate) {
    this.animationAtoms.translate.updateOrigin({ x, y });
  }
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

#### createDecorationAtoms(atoms: any[], moleculeWidth?, moleculeHeight?): void
```typescript
private createDecorationAtoms(atoms: any[], moleculeWidth?: number, moleculeHeight?: number): void {
  const moleculeRadius = (this.molecule as any).radius ?? 12;
  atoms.forEach(config => {
    const context = this.createContext();
    try {
      switch (config.capability) {
        case 'background':
          new Atoms.BackgroundAtom(context, this.element, {
            color: config.color,
            position: config.position,
            width: config.width ?? moleculeWidth,
            height: config.height ?? moleculeHeight,
            radius: config.radius ?? moleculeRadius
          });
          break;
        case 'border':
          new Atoms.BorderAtom(context, this.element, {
            borderWidth: config.borderWidth,
            color: config.color,
            position: config.position,
            width: config.width ?? moleculeWidth,
            height: config.height ?? moleculeHeight,
            radius: config.radius ?? moleculeRadius
          });
          break;
        case 'shadow':
          new Atoms.ShadowAtom(context, this.element, {
            x: config.x,
            y: config.y,
            shadowBlur: config.shadowBlur,
            color: config.color,
            shadowWidth: config.shadowWidth,
            position: config.position,
            width: config.width ?? moleculeWidth,
            height: config.height ?? moleculeHeight,
            radius: config.radius ?? moleculeRadius
          });
          break;
      }
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建装饰原子失败:`, error);
    }
  });
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
            position: atomConfig.position
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
            position: atomConfig.position
          }));
          break;
        case 'code':
          this.contentAtoms.push(new Atoms.CodeAtom(context, this.element, {
            code: atomConfig.code,
            language: atomConfig.language,
            position: atomConfig.position,
            width: atomConfig.width,
            height: atomConfig.height,
            backgroundColor: atomConfig.backgroundColor,
            autoFormat: atomConfig.autoFormat
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

#### createAnimationAtoms(animationConfigs: any[]): void
```typescript
private createAnimationAtoms(animationConfigs: any[]): void {
  animationConfigs.forEach(config => {
    const context = this.createContext();
    try {
      switch (config.capability) {
        case 'scale':
          this.animationAtoms.scale = new Atoms.ScaleAtom(context, this.element, {
            value: config.value,
            trigger: config.trigger,
            defaultValue: 1,
            keepOnRelease: config.keepOnRelease
          });
          break;
        case 'opacity':
          this.animationAtoms.opacity = new Atoms.OpacityAtom(context, this.element, {
            value: config.value,
            trigger: config.trigger,
            defaultValue: 1,
            keepOnRelease: config.keepOnRelease
          });
          break;
        case 'rotate':
          this.animationAtoms.rotate = new Atoms.RotateAtom(context, this.element, {
            value: config.value,
            trigger: config.trigger,
            defaultValue: 0,
            keepOnRelease: config.keepOnRelease
          });
          break;
        case 'translate':
          this.animationAtoms.translate = new Atoms.TranslateAtom(context, this.element, {
            trigger: config.trigger,
            keepOnRelease: config.keepOnRelease
          }, this.state.position);
          break;
        case 'height':
          this.animationAtoms.height = new Atoms.HeightAtom(context, this.element, {
            value: config.value,
            trigger: config.trigger,
            collapsedValue: config.collapsedValue,
            keepOnRelease: config.keepOnRelease
          });
          break;
        case 'width':
          this.animationAtoms.width = new Atoms.WidthAtom(context, this.element, {
            value: config.value,
            trigger: config.trigger,
            collapsedValue: config.collapsedValue,
            keepOnRelease: config.keepOnRelease
          });
          break;
        case 'collapse':
          if (!this.animationAtoms.collapse) {
            this.animationAtoms.collapse = [];
          }
          this.animationAtoms.collapse.push(new Atoms.CollapseAtom(
            context,
            this.element,
            {
              group: config.group,
              expandedValue: config.expandedValue,
              collapsedValue: config.collapsedValue
            },
            this.state.collapsedGroups
          ));
          break;
      }
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建动画原子失败:`, error);
    }
  });
}
```

#### createInputAtoms(atoms: any[]): void
```typescript
private createInputAtoms(atoms: any[]): void {
  const clickConfig = atoms.find(a => a.capability === 'click');
  if (clickConfig) {
    const context = this.createContext();
    try {
      new Atoms.ClickAtom(context, this.element, {
        onClick: () => {
          this.updateClickState(true);
        },
        onDoubleClick: clickConfig.onDoubleClick
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建ClickAtom失败:`, error);
    }
  }

  const dragConfig = atoms.find(a => a.capability === 'drag');
  if (dragConfig) {
    const context = this.createContext();
    try {
      new Atoms.DragAtom(context, this.element, {
        handle: dragConfig.handle,
        bounds: dragConfig.bounds
      }, {
        onDragStart: (pos) => {
          this.updateDragStart(pos);
        },
        onDragMove: (pos) => {
          this.updateDragMove(pos);
        },
        onDragEnd: () => {
          this.updateDragEnd();
        }
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建DragAtom失败:`, error);
    }
  }

  const resizeConfig = atoms.find(a => a.capability === 'resize');
  if (resizeConfig) {
    const context = this.createContext();
    try {
      new Atoms.ResizeAtom(context, this.element, {
        minWidth: resizeConfig.minWidth,
        minHeight: resizeConfig.minHeight,
        maxWidth: resizeConfig.maxWidth,
        maxHeight: resizeConfig.maxHeight
      }, {
        onResizeStart: (size) => {
          this.updateResizeStart(size);
          resizeConfig.onResizeStart?.(size);
        },
        onResize: (size) => {
          this.updateResizeMove(size);
          resizeConfig.onResize?.(size);
        },
        onResizeEnd: (size) => {
          this.updateResizeEnd(size);
          resizeConfig.onResizeEnd?.(size);
        }
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建ResizeAtom失败:`, error);
    }
  }

  const scrollConfig = atoms.find(a => a.capability === 'scroll');
  if (scrollConfig) {
    const context = this.createContext();
    try {
      new Atoms.ScrollAtom(context, this.element, {
        direction: scrollConfig.direction,
        maxScrollX: scrollConfig.maxScrollX,
        maxScrollY: scrollConfig.maxScrollY
      }, {
        onScroll: (pos) => {
          this.updateScrollState(pos.scrollX, pos.scrollY);
          scrollConfig.onScroll?.(pos);
        }
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建ScrollAtom失败:`, error);
    }
  }

  const hoverConfig = atoms.find(a => a.capability === 'hover');
  if (hoverConfig) {
    const context = this.createContext();
    try {
      new Atoms.HoverAtom(context, this.element, {
        onHoverStart: () => {
          this.updateHoverState(true);
        },
        onHoverEnd: () => {
          this.updateHoverState(false);
        }
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建HoverAtom失败:`, error);
    }
  }

  const collapseConfigs = atoms.filter(a => a.capability === 'collapse');
  collapseConfigs.forEach(config => {
    this.element.addEventListener('click', () => {
      if (this.animationAtoms.collapse) {
        const collapseAtom = this.animationAtoms.collapse.find(c => c.getGroup() === config.group);
        if (collapseAtom) {
          collapseAtom.toggle();
        }
      }
    });
  });
}
```

#### createResizeHandles(configs: any[]): void
```typescript
private createResizeHandles(configs: any[]): void {
  configs.forEach(config => {
    const context = this.createContext();
    try {
      this.animationAtoms.resizeHandle = new Atoms.ResizeHandleAtom(context, this.element, {
        id: config.id,
        targetAtomIds: config.targetAtomIds,
        fixedAtomIds: config.fixedAtomIds,
        initialWidth: this.molecule.width,
        initialHeight: this.molecule.height,
        minWidth: config.minWidth,
        minHeight: config.minHeight,
        handleColor: config.handleColor
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建ResizeHandleAtom失败:`, error);
    }
  });
}
```

#### notifyHoverChange(isHovered: boolean): void
```typescript
private notifyHoverChange(isHovered: boolean): void {
  this.animationAtoms.scale?.onHoverChange(isHovered);
  this.animationAtoms.opacity?.onHoverChange(isHovered);
  this.animationAtoms.rotate?.onHoverChange(isHovered);
  this.animationAtoms.height?.onHoverChange(isHovered);
  this.animationAtoms.width?.onHoverChange(isHovered);
}
```

#### notifyClickChange(isClicked: boolean): void
```typescript
private notifyClickChange(isClicked: boolean): void {
  this.animationAtoms.scale?.onClickChange(isClicked);
  this.animationAtoms.opacity?.onClickChange(isClicked);
  this.animationAtoms.rotate?.onClickChange(isClicked);
  this.animationAtoms.height?.onClickChange(isClicked);
  this.animationAtoms.width?.onClickChange(isClicked);
}
```

#### updateHoverState(isHovered: boolean): void
```typescript
public updateHoverState(isHovered: boolean): void {
  this.state.isHovered = isHovered;
  this.notifyHoverChange(isHovered);
  this.emitStateChange({ isHovered });
}
```

#### updateClickState(isClicked: boolean): void
```typescript
public updateClickState(isClicked: boolean): void {
  this.state.isClicked = isClicked;
  this.notifyClickChange(isClicked);
  this.emitStateChange({ isClicked });
}
```

#### updateDragStart(pos: { x: number; y: number }): void
```typescript
public updateDragStart(pos: { x: number; y: number }): void {
  this.state.isDragging = true;
  this.state.position = { x: pos.x, y: pos.y };
  this.animationAtoms.translate?.onDragMove(pos.x, pos.y);
  this.emitStateChange({ isDragging: true, position: pos });
}
```

#### updateDragMove(pos: { x: number; y: number }): void
```typescript
public updateDragMove(pos: { x: number; y: number }): void {
  this.state.position = { x: pos.x, y: pos.y };
  this.animationAtoms.translate?.onDragMove(pos.x, pos.y);
  this.emitStateChange({ position: pos });
}
```

#### updateDragEnd(): void
```typescript
public updateDragEnd(): void {
  this.state.isDragging = false;
  this.animationAtoms.translate?.onDragEnd();
  this.emitStateChange({ isDragging: false });
}
```

#### updateResizeStart(size: { width: number; height: number }): void
```typescript
public updateResizeStart(size: { width: number; height: number }): void {
  this.state.isResizing = true;
  this.state.width = size.width;
  this.state.height = size.height;
  this.emitStateChange({ isResizing: true, width: size.width, height: size.height });
}
```

#### updateResizeMove(size: { width: number; height: number }): void
```typescript
public updateResizeMove(size: { width: number; height: number }): void {
  this.state.width = size.width;
  this.state.height = size.height;
  this.element.style.width = `${size.width}px`;
  this.element.style.height = `${size.height}px`;
  this.emitStateChange({ width: size.width, height: size.height });
}
```

#### updateResizeEnd(size: { width: number; height: number }): void
```typescript
public updateResizeEnd(size: { width: number; height: number }): void {
  this.state.isResizing = false;
  this.state.width = size.width;
  this.state.height = size.height;
  this.emitStateChange({ isResizing: false, width: size.width, height: size.height });
}
```

#### updateScrollState(scrollX?: number, scrollY?: number): void
```typescript
public updateScrollState(scrollX?: number, scrollY?: number): void {
  if (scrollX !== undefined) {
    this.state.scrollX = scrollX;
  }
  if (scrollY !== undefined) {
    this.state.scrollY = scrollY;
  }
  this.emitStateChange({ scrollX: this.state.scrollX, scrollY: this.state.scrollY });
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
  molecules?: Molecule[];                          // 子分子数组（不支持嵌套）
  width?: number | string;                         // 宽度
  height?: number | string;                         // 高度
  radius?: number;                                  // 圆角
}
```

**子分子特性**：
- 子分子格式与普通分子完全一致
- 子分子位置相对于父分子
- 支持无限嵌套（子分子中可包含子分子）
- 子分子会跟随父分子的缩放、拖拽等动画效果

### 5. Atom (原子)

**文件位置**：`/src/atoms.ts`

**接口定义**：
```typescript
export interface AtomContext {
  bakerId: string;
  bakerIndex: number;
  atomIndex: number;
}

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
  borderWidth?: number;
  borderHeight?: number;
}

export interface ShadowAtom {
  capability: 'shadow';
  context: AtomContext;
  x: number;
  y: number;
  shadowBlur?: number;
  color: [number, number, number];
  shadowWidth?: number;
}

// 动画原子接口
export interface ScaleAtom {
  capability: 'scale';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  duration?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export interface OpacityAtom {
  capability: 'opacity';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  duration?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export interface RotateAtom {
  capability: 'rotate';
  context: AtomContext;
  value: number;
  trigger: 'hover' | 'click' | 'doubleclick';
  duration?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export interface TranslateAtom {
  capability: 'translate';
  context: AtomContext;
  trigger: 'drag';
  keepOnRelease?: boolean;
}

export interface HeightAtom {
  capability: 'height';
  context: AtomContext;
  value: number;
  trigger: 'click' | 'hover' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export interface WidthAtom {
  capability: 'width';
  context: AtomContext;
  value: number;
  trigger: 'click' | 'hover' | 'doubleclick';
  collapsedValue?: number;
  keepOnRelease?: boolean;
  toggleOnClick?: boolean;
}

export interface CollapseAtom {
  capability: 'collapse';
  context: AtomContext;
  group: string;
  expandedValue?: number;
  duration?: number;
}
```

## 数据流

### 初始化数据流

```
用户配置 (Molecule[])
    │
    ▼
BeakerManager.process()
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

### 拖拽数据流

```
鼠标事件 → DragAtom(输出 clientX/clientY)
    │
    ▼
Beaker.updateDragStart/Move/End(mouse)
    │
    ▼
TranslateAtom.onDragStart/Move/End(mouse)
    │
    ├── 计算位移: dx = mouse.clientX - mouseStartX
    ├── 应用位置: element.style.left = elementStartX + dx
    └── 根据 keepOnRelease 决定是否复原
```

### 点击数据流

```
点击事件 → ClickAtom(输出 clickCount)
    │
    ▼
Beaker.updateClickState(isClicked, clickCount)
    │
    ▼
动画原子.onClickChange(isClicked, clickCount)
    │
    ├── toggleOnClick: true → 奇数次应用，偶数次复原
    └── toggleOnClick: false → 点击应用，松开根据 keepOnRelease 决定
```

### 双击数据流

```
双击事件 → ClickAtom
    │
    ▼
Beaker.updateDoubleClick()
    │
    ▼
动画原子.onDoubleClick()
    │
    ├── trigger: 'doubleclick' → 执行动画
    └── 支持 toggleOnClick 切换模式
```

### 布局计算数据流

```
BeakerManager.process()
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
| TextAtom | `/src/atoms/TextAtom.ts` | 显示文本内容（支持 fontWeight/fontStyle/textAlign/overflow） |
| ImageAtom | `/src/atoms/ImageAtom.ts` | 显示图片 |
| VideoAtom | `/src/atoms/VideoAtom.ts` | 播放视频 |
| AudioAtom | `/src/atoms/AudioAtom.ts` | 播放音频 |
| CodeAtom | `/src/atoms/CodeAtom.ts` | 显示代码（内联语法高亮/自动格式化/语言识别） |
| IconAtom | `/src/atoms/IconAtom.ts` | 显示图标（支持 SVG、emoji、文本） |
| CanvasAtom | `/src/atoms/CanvasAtom.ts` | 绘图画布（支持工具栏/黑板模式/可调整大小） |
| EditableTextAtom | `/src/atoms/EditableTextAtom.ts` | 可编辑文本（双击进入编辑模式） |

#### 2. 输入原子 (Input Atom)

负责处理用户交互，包括：

| 原子类型 | 文件位置 | 功能描述 |
|---------|---------|---------|
| ClickAtom | `/src/atoms/ClickAtom.ts` | 点击事件 |
| DragAtom | `/src/atoms/DragAtom.ts` | 拖拽功能 |
| HoverAtom | `/src/atoms/HoverAtom.ts` | 悬停事件 |
| ResizeAtom | `/src/atoms/ResizeAtom.ts` | 调整大小 |
| ResizeHandleAtom | `/src/atoms/ResizeHandleAtom.ts` | 调整大小把手（三角形，支持等比缩放） |
| ScrollAtom | `/src/atoms/ScrollAtom.ts` | 滚动事件 |
| InputAtom | `/src/atoms/InputAtom.ts` | 单行文本输入 |
| TextareaAtom | `/src/atoms/TextareaAtom.ts` | 多行文本输入 |
| SelectAtom | `/src/atoms/SelectAtom.ts` | 下拉选择 |
| CheckboxAtom | `/src/atoms/CheckboxAtom.ts` | 复选框 |

#### 3. 装饰原子 (Decoration Atom)

负责视觉样式，包括：

| 原子类型 | capability | 功能描述 |
|---------|---------|---------|
| BackgroundAtom | `background` | 背景装饰（支持渐变、透明度） |
| BorderAtom | `border` | 边框装饰（独立DOM，borderWidth/width/height/radius） |
| ShadowAtom | `shadow` | 阴影装饰（独立DOM，x/y/shadowBlur/shadowWidth/width/height/radius） |

注意：装饰原子各自创建独立DOM元素，绝对定位；最先渲染（底层），内容原子后渲染（上层）；分子容器完全透明，不承载样式。

#### 4. 布局原子 (Layout Atom)

负责布局，包括：

| 原子类型 | capability | 功能描述 |
|---------|---------|---------|
| FlexAtom | `flex` | Flexbox 布局容器 |
| ScrollContainerAtom | `scroll-container` | 滚动容器 |

#### 5. 动画原子 (Animation Atom)

负责动画效果，包括：

| 原子类型 | capability | 功能描述 |
|---------|---------|---------|
| ScaleAtom | `scale` | 缩放动画 |
| OpacityAtom | `opacity` | 透明度动画 |
| RotateAtom | `rotate` | 旋转动画 |
| TranslateAtom | `translate` | 平移动画（与DragAtom配合） |
| HeightAtom | `height` | 高度动画 |
| WidthAtom | `width` | 宽度动画 |
| CollapseAtom | `collapse` | 折叠动画 |

**触发方式**：`trigger: 'hover' | 'click' | 'doubleclick' | 'drag'`

**行为控制**：
- `keepOnRelease?: boolean` - 松开后保持效果（默认 false）
- `toggleOnClick?: boolean` - 点击切换模式（默认 true，仅对 click/doubleclick 有效）

| trigger | toggleOnClick | keepOnRelease | 行为 |
|---------|---------------|---------------|------|
| hover | - | false | 悬停应用，离开复原 |
| hover | - | true | 悬停应用，离开保持 |
| click | true | - | 点击1次应用，点击2次复原 |
| click | false | false | 点击应用，松开复原 |
| click | false | true | 点击应用，松开保持 |
| doubleclick | true | - | 双击1次应用，双击2次复原 |
| doubleclick | false | - | 每次双击都应用 |

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

### 4. 缩放动画算法

**目的**：实现平滑的缩放动画

**输入**：起始缩放值、目标缩放值、动画时长

**输出**：更新后的 DOM 样式

**算法**：
```
animateToScale(targetScale):
    startScale = currentScale
    startTime = performance.now()
    
    animate(currentTime):
        elapsed = currentTime - startTime
        progress = min(elapsed / duration, 1)
        eased = progress * (2 - progress)  // ease-out
        
        currentScale = startScale + (targetScale - startScale) * eased
        applyScale(currentScale)
        
        if progress < 1:
            requestAnimationFrame(animate)
```

**特点**：
- 使用 `requestAnimationFrame` 实现平滑动画
- 采用 ease-out 缓动函数
- 自动缩放所有子元素的位置、尺寸、字体、边框、阴影

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
  readonly capability = 'custom';
  readonly context: AtomContext;

  constructor(context: AtomContext, element: HTMLElement, config: CustomAtomConfig) {
    this.context = context;
    // 自定义逻辑
    element.textContent = config.customProperty;
    element.addEventListener('click', config.onCustomEvent);
  }
}

// 3. 在 Beaker 中添加支持
private createCustomAtom(id: string, config: CustomAtomConfig): void {
  const atom = new CustomAtom(this.createContext(), this.element, config);
  this.contentAtoms.push(atom);
}
```

### 自定义装饰器

```typescript
interface CustomDecoratorConfig {
  customStyle: string;
}

class CustomDecorator {
  readonly capability = 'custom-decorator';
  readonly context: AtomContext;

  constructor(context: AtomContext, element: HTMLElement, config: CustomDecoratorConfig) {
    this.context = context;
    element.style.filter = config.customStyle;
  }
}
```

### 自定义动画

```typescript
interface CustomAnimationConfig {
  customProperty: number;
  duration: number;
}

class CustomAnimation {
  readonly capability = 'custom-animation';
  readonly context: AtomContext;

  constructor(context: AtomContext, element: HTMLElement, config: CustomAnimationConfig) {
    this.context = context;
    element.style.transition = `customProperty ${config.duration}ms`;
    requestAnimationFrame(() => {
      element.style.customProperty = config.customProperty;
    });
  }
}
```

## 文件结构

```
/Users/liuyulin/atom-engine/
├── src/
│   ├── BeakerManager.ts      # 物质管理器（入口类）
│   ├── BeakerManager.ts         # 焙烤管理器
│   ├── Beaker.ts                # 焙烤器（包含动画原子的实现）
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
│       ├── BackgroundAtom.ts    # 背景装饰原子
│       ├── BorderAtom.ts        # 边框装饰原子
│       ├── ShadowAtom.ts        # 阴影装饰原子
│       ├── ClickAtom.ts         # 点击原子
│       ├── DragAtom.ts          # 拖拽原子
│       ├── HoverAtom.ts         # 悬停原子
│       ├── ResizeAtom.ts        # 调整大小原子
│       ├── ResizeHandleAtom.ts  # 调整把手原子
│       ├── ScrollAtom.ts        # 滚动原子
│       ├── ScaleAtom.ts         # 缩放动画原子
│       ├── OpacityAtom.ts       # 透明度动画原子
│       ├── RotateAtom.ts        # 旋转动画原子
│       ├── TranslateAtom.ts     # 平移动画原子
│       ├── HeightAtom.ts        # 高度动画原子
│       ├── WidthAtom.ts         # 宽度动画原子
│       └── CollapseAtom.ts      # 折叠动画原子
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
  "main": "dist/BeakerManager.js",
  "module": "dist/BeakerManager.mjs",
  "types": "dist/BeakerManager.d.ts",
  "exports": {
    ".": {
      "types": "./dist/BeakerManager.d.ts",
      "import": "./dist/BeakerManager.mjs",
      "require": "./dist/BeakerManager.js"
    }
  },
  "scripts": {
    "build": "tsup src/BeakerManager.ts --format cjs,esm --dts",
    "dev": "tsup src/BeakerManager.ts --format cjs,esm --dts --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

**构建说明**：
- `main`：Node.js 环境使用的 CommonJS 格式，入口文件为 `dist/BeakerManager.js`
- `module`：浏览器环境使用的 ES Module 格式，入口文件为 `dist/BeakerManager.mjs`
- `types`：TypeScript 类型声明文件，类型文件为 `dist/BeakerManager.d.ts`
- 构建输出文件名基于源文件名 `BeakerManager.ts`，因此所有输出文件都以 `BeakerManager` 开头

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
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
describe('BeakerManager', () => {
  it('should create all bakers', () => {
    const molecules = [
      { id: 'm1', atoms: [] },
      { id: 'm2', atoms: [] }
    ];

    const manager = new BeakerManager(molecules);
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

## ResizeHandleAtom 详细架构

### 概述

ResizeHandleAtom 是一个特殊的输入原子，用于创建可视化的调整大小把手。它允许用户通过拖拽来调整容器和指定原子的尺寸。

### 核心功能

1. **三种处理方式**：
   - `targetAtomIds`：只更新 width/height
   - `fixedAtomIds`：不做任何修改
   - 其他原子：等比缩放（位置、大小、文字字号）

2. **把手样式**：
   - 三角形，填满右下角
   - 圆角跟容器同步
   - 颜色可配置，默认浅灰色

3. **尺寸限制**：
   - 支持 minWidth/minHeight 配置
   - 拖拽时不会小于最小尺寸

### 配置接口

```typescript
interface ResizeHandleAtomConfig {
  id: string;                      // 原子唯一标识符
  targetAtomIds?: string[];        // 只更新尺寸的原子id
  fixedAtomIds?: string[];         // 不做任何修改的原子id
  initialWidth?: number;           // 初始宽度
  initialHeight?: number;          // 初始高度
  minWidth?: number;               // 最小宽度
  minHeight?: number;              // 最小高度
  handleColor?: [number, number, number];  // 把手颜色
}
```

### 数据流

```
用户拖拽把手 → onMouseMove → 计算新尺寸
                    ↓
        更新容器尺寸 (this.element.style.width/height)
                    ↓
        更新target原子尺寸 (el.style.width/height)
                    ↓
        更新其他原子 (等比缩放)
```

### Beaker 创建流程

```typescript
private createResizeHandles(configs: any[]): void {
  configs.forEach(config => {
    const context = this.createContext();
    try {
      this.animationAtoms.resizeHandle = new Atoms.ResizeHandleAtom(context, this.element, {
        id: config.id,
        targetAtomIds: config.targetAtomIds,
        fixedAtomIds: config.fixedAtomIds,
        initialWidth: this.molecule.width,
        initialHeight: this.molecule.height,
        minWidth: config.minWidth,
        minHeight: config.minHeight,
        handleColor: config.handleColor
      });
    } catch (error) {
      console.error(`[Beaker Error] ${this.id} - 创建ResizeHandleAtom失败:`, error);
    }
  });
}
```

### 使用示例

```javascript
{
  id: 'resize-handle',
  capability: 'resize-handle',
  targetAtomIds: ['bg-main', 'border-main', 'shadow-main'],
  fixedAtomIds: ['text-title', 'text-subtitle'],
  minWidth: 200,
  minHeight: 150,
  handleColor: [100, 150, 255]
}
```

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
  molecules?: Molecule[];  // 子分子数组（不支持嵌套）
  width?: number;
  height?: number;
  radius?: number;
  visible?: boolean;        // 初始可见性
  disabled?: boolean;       // 初始禁用状态
  selected?: boolean;       // 初始选中状态
  zIndex?: number;          // 初始层级
  className?: string;       // 自定义 CSS 类名
  data?: Record<string, any>;  // 自定义数据
  onMount?: (element: HTMLElement) => void;   // 挂载回调
  onDestroy?: () => void;   // 销毁回调
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
  zIndex?: number;           // 层级
  visible?: boolean;         // 可见性
  disabled?: boolean;        // 禁用状态
  selected?: boolean;        // 选中状态
  opacity?: number;          // 透明度
  scale?: number;            // 缩放比例
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

- **类名**：PascalCase（如 `BeakerManager`、`BeakerManager`）
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
 * @class BeakerManager
 * @example
 * const manager = new BeakerManager(molecules);
 * document.body.appendChild(manager.getBakerManager().getBakerManagerContainer());
 */
class BeakerManager {
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
