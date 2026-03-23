# AtomEngine 原子引擎

> 纯 JavaScript 组件渲染引擎，无需任何框架依赖

## ⚠️ 使用前检查 CSS

引擎依赖浏览器的 `left`/`top` 定位，宿主页面需确保：

```css
/* 必须重置的默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}
```

**常见问题**：
- 浏览器默认 `body { margin: 8px }` 会导致分子偏移
- 容器的 `margin: 0 auto` 居中会影响子元素定位基准
- `position: relative` 的祖先元素会作为定位参考

## 核心理念

将 UI 组件拆分为最小单元「原子」，通过组合原子构建复杂界面。引擎自动处理渲染、样式、动画和交互。

## 数据格式统一原则

从 Demo 到引擎内部，数据格式完全一致，只有数据值变化。

```javascript
// Demo 直接写 molecules 数组
const molecules = [
  {
    id: 'mol-A',
    position: { x: 0, y: 0 },  // 初始为相对坐标或 0
    atoms: [...],
    vertical: 1,       // 网格垂直位置
    horizontal: 1,     // 网格水平位置
    verticalGap: 10,   // 与上下分子的间距
    horizontalGap: 10, // 与左右分子的间距
  },
  ...
];
```

## 架构总览

### 组件关系

| 组件 | 是否导出 | 类型 | 由谁创建 |
|------|---------|------|---------|
| SubstanceManager | 是 | 实例类 | demo 创建 |
| BeakerManager | 否 | 实例类 | SubstanceManager 创建 |
| Beaker | 否 | 实例类 | BeakerManager 创建 |
| AtomRenderer | 否 | 独立模块 | Beaker 使用 |

### 渲染位置

#### Beaker 渲染到页面
- 渲染容器：**document.body**（页面本身）
- 定位基准：**页面左上角 (0, 0)**
- 定位方式：每个 Beaker 的 element 设置 `style.position = 'absolute'`
- 相对定位：element.style.left 和 element.style.top 相对于 document.body

#### AtomRenderer 渲染到分子容器
- 渲染容器：**Beaker.element**（分子 DOM 容器）
- 定位基准：**分子容器左上角 (0, 0)**
- 定位方式：原子 DOM 元素设置 `style.position = 'absolute'`
- 相对定位：原子元素的 style.left 和 style.top 相对于 Beaker.element
- Beaker 负责把分子容器添加到页面

### 渲染流程（逐行描述）

```
1. demo 调用：new SubstanceManager(molecules)
2. SubstanceManager 构造函数执行：
   2.1 调用 this.process(molecules) 计算每个分子的 position
   2.2 创建 this.beakerManager = new BeakerManager(processedMolecules)
   2.3 构造函数结束，不返回任何值（返回 undefined）
3. BeakerManager 构造函数执行：
   3.1 创建 this.bakers = new Map()
   3.2 遍历 processedMolecules，对每个 molecule：
       3.2.1 生成 baker-id（如 'baker-0'）
       3.2.2 创建 baker = new Beaker(baker-id, molecule, this.handleBakerStateChange.bind(this))
       3.2.3 this.bakers.set(baker-id, baker)
       3.2.4 document.body.appendChild(baker.element)
   3.3 构造函数结束
4. Beaker 构造函数执行：
   4.1 保存 this.id = id
   4.2 保存 this.molecule = molecule
   4.3 创建 this.element = document.createElement('div')
   4.4 设置 this.element.style.position = 'absolute'
   4.5 设置 this.element.style.left = `${molecule.position.x}px`
   4.6 设置 this.element.style.top = `${molecule.position.y}px`
   4.7 调用 this.init()
   4.8 构造函数结束
5. Beaker.init() 执行：
   5.1 this.decompose() 分解原子为 renderable 和 others
   5.2 this.calculateContainerSize() 计算容器宽高
   5.3 设置 this.element.style.width 和 this.element.style.height
   5.4 this.renderDecorationAtoms() 渲染背景、边框、阴影
   5.5 this.renderContentAtoms() 渲染文本、图片、视频、音频、代码、图标、画布
   5.6 this.renderResizeHandles() 渲染缩放句柄
   5.7 this.applyAnimationStyles() 应用 scale、opacity、rotate、translate 动画
   5.8 this.setupInputHandlers() 设置 drag、resize、scroll、click 交互
   5.9 this.attachEventListeners() 绑定 hover、click、drag 事件监听
6. Beaker 渲染完成，element 已在步骤 3.2.4 添加到 document.body
7. 所有 Beaker 渲染完成，页面显示完成
```

### 代码调用关系图

```
页面 (document.body，定位基准 0,0)
    │
    └── Beaker.element (position: absolute, left: x, top: y)
           │
           └── 原子 DOM 元素们 (position: absolute，相对于 Beaker.element 定位)
                │
                └── AtomRenderer.render() 生成

SubstanceManager (导出)
    │
    └── BeakerManager (非导出)
           │
           └── Beaker (非导出)
                  │
                  ├── 创建 element，设置 position: absolute，left，top
                  ├── 把 element 添加到 document.body
                  │
                  └── AtomRenderer (非导出)
                         │
                         └── 渲染原子到 Beaker.element 内
```

### 详细类定义

#### SubstanceManager
```typescript
// 导出
class SubstanceManager {
  private beakerManager: BeakerManager;

  constructor(molecules: Molecule[]) {
    // 1. 计算位置
    const processedMolecules = this.process(molecules);
    // 2. 创建 BeakerManager
    this.beakerManager = new BeakerManager(processedMolecules);
    // 3. 构造函数结束，不返回任何值
  }

  // 计算每个分子的 position
  // 输入：molecules[] (含 vertical、horizontal、verticalGap、horizontalGap)
  // 输出：molecules[] (position 已计算)
  private process(molecules: Molecule[]): Molecule[] {
    // 1. 判断是否有 vertical 或 horizontal 属性
    // 2. 如果没有：直接设置 position 为原 position 或 {x:0, y:0}
    // 3. 如果有：
    //    - 设置默认值：vertical:1, horizontal:1, verticalGap:10, horizontalGap:10
    //    - cellWidth 默认 100，cellHeight 默认 100
    //    - 计算规则：
    //      - 如果只有 vertical：根据 vertical 计算 y，同一 vertical 的分子排在同一行
    //      - 如果只有 horizontal：根据 horizontal 计算 x
    //      - 如果两者都有：根据 horizontal 计算 x，根据 vertical 计算 y
    //    - 返回带 position 的 molecules
  }
}
```

#### BeakerManager
```typescript
// 非导出
class BeakerManager {
  private bakers: Map<string, Beaker> = new Map();
  private bakerStates: Map<string, BakerState> = new Map();
  private bakerIdCounter: number = 0;

  constructor(molecules: Molecule[]) {
    // 遍历每个 molecule，创建 Beaker
    molecules.forEach(molecule => {
      const bakerId = `baker-${this.bakerIdCounter++}`;
      const baker = new Beaker(bakerId, molecule, this.handleBakerStateChange.bind(this));
      this.bakers.set(bakerId, baker);
      // 直接添加到 document.body
      document.body.appendChild(baker.element);
    });
  }

  private handleBakerStateChange(bakerId: string, state: Partial<BakerState>): void {
    // 更新 baker 状态
  }
}
```

#### Beaker
```typescript
// 非导出
class Beaker {
  public readonly id: string;
  public readonly molecule: Molecule;
  public readonly element: HTMLElement;
  private state: BakerState;

  constructor(id: string, molecule: Molecule, onStateChange?: StateChangeCallback) {
    this.id = id;
    this.molecule = molecule;
    this.element = document.createElement('div');
    this.element.style.position = 'absolute';
    this.element.style.left = `${molecule.position?.x ?? 0}px`;
    this.element.style.top = `${molecule.position?.y ?? 0}px`;
    this.init();
  }

  private init(): void {
    // 分解原子
    // 计算容器大小
    // 渲染所有原子
    // 设置交互处理
  }
}
```

#### AtomRenderer
```typescript
// 非导出
class AtomRenderer {
  render(atom: Atom): RenderResult {
    // 1. 根据 atom.capability 创建对应 DOM 元素
    // 2. 设置样式（position: absolute, left, top）
    // 3. 把原子 DOM 元素添加到 Beaker.element（分子容器）
    // 4. 返回 RenderResult
  }
}
```

### 渲染流程（完整）

```
Demo
  │
  └─ new SubstanceManager(molecules)
       │
       ├─ process(molecules)
       │    └─ 计算每个分子的 position
       │
       ├─ new BeakerManager(processedMolecules)
       │    │
       │    ├─ for each molecule:
       │    │    └─ new Beaker(baker-id, molecule, onStateChange)
       │    │         │
       │    │         ├─ 创建 element (position: absolute)
       │    │         ├─ decompose() 分解原子
       │    │         ├─ calculateContainerSize() 计算大小
       │    │         ├─ renderDecorationAtoms() 渲染装饰
       │    │         ├─ renderContentAtoms() 渲染内容
       │    │         ├─ setupInputHandlers() 设置交互
       │    │         └─ document.body.appendChild(element)
       │    │
       │    └─ 管理所有 Beaker 实例
       │
       └─ 构造函数完成，不返回任何东西
```

### 初始化 vs 运行时

#### 初始化阶段（一次）

```
Demo → new SubstanceManager(molecules)
              ↓
       ┌────────────────────┐
       │ 1. process() 计算位置 │
       │ 2. 创建 BeakerManager │
       │ 3. 创建 Beaker 实例   │
       │ 4. 渲染到 document.body │
       └────────────────────┘
```

#### 运行时阶段

```
用户输入 → Beaker 处理 → 修改 this.atoms → 重新渲染
                              ↑
                    不再访问原始 molecule 数据
```

## 核心组件职责

| 组件 | 类型 | 职责 | 说明 |
|------|------|------|------|
| **SubstanceManager** | 实例类，导出 | 入口点，布局计算 | demo 创建实例，内部创建 BeakerManager |
| **BeakerManager** | 实例类，非导出 | 管理多个 Beaker | 由 SubstanceManager 创建，维护 baker 集合和状态 |
| **Beaker** | 实例类，非导出 | 单个分子渲染器 | 每个 molecule 一个实例，有唯一 ID，向 BeakerManager 报告状态 |
| **AtomRenderer** | 独立模块，非导出 | 原子渲染器 | 由 Beaker 使用，根据原子类型渲染对应 DOM 元素 |

## 导出说明

本引擎**仅导出 SubstanceManager**，其他类均为内部实现：

```javascript
// demo 端
import { SubstanceManager } from './dist/SubstanceManager.mjs';

const molecules = [...];

// 创建实例，自动渲染到页面
new SubstanceManager(molecules);

// 不返回任何东西
```

## 渲染位置

分子直接渲染到页面（document.body），以页面左上角 (0, 0) 为定位基准。

每个 Beaker 的 DOM 元素：
- `position: absolute`
- 相对于 document.body 定位
- 位置由 molecule.position 或计算后的 position 决定

## Molecule 分子

分子是原子的容器，也是渲染的基本单元。

### Molecule 结构

```typescript
interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };  // 绝对位置
  vertical?: number;       // 网格垂直位置
  horizontal?: number;     // 网格水平位置
  verticalGap?: number;     // 与上下分子的间距，默认 10
  horizontalGap?: number;  // 与左右分子的间距，默认 10
  width?: number;          // 分子宽度
  height?: number;         // 分子高度
  atoms: Atom[];
}
```

## Atom 原子

原子是渲染的最小单元。原子分为四类：内容原子、装饰原子、动画原子、交互原子。

```typescript
type Atom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom | CanvasAtom |
  BackgroundAtom | BorderAtom | ShadowAtom |
  ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom |
  DragAtom | ResizeAtom | ResizeHandleAtom |
  ScrollAtom | ClickAtom |
  HeightAtom | WidthAtom | CollapseAtom;
```

### 基类

```typescript
interface BaseAtom {
  id?: string;                    // 原子 ID，可选
  position?: Position;             // 位置，相对于分子容器
  duration?: number;               // 动画时长（毫秒）
}

interface Position {
  x: number;
  y: number;
  z?: number;
}
```

### 内容原子（渲染实际内容）

#### TextAtom - 文本
```typescript
interface TextAtom extends BaseAtom {
  capability: 'text';
  text: string;                    // 文本内容
  size: number;                    // 字体大小
  color: [number, number, number]; // RGB 颜色，如 [255, 0, 0]
}
```

#### ImageAtom - 图片
```typescript
interface ImageAtom extends BaseAtom {
  capability: 'image';
  src: string;                     // 图片 URL
  width: number;                   // 图片宽度
  height: number;                  // 图片高度
  alt?: string;                    // alt 文本
}
```

#### VideoAtom - 视频
```typescript
interface VideoAtom extends BaseAtom {
  capability: 'video';
  src: string;                     // 视频 URL
  width?: number;                   // 视频宽度
  height?: number;                  // 视频高度
}
```

#### AudioAtom - 音频
```typescript
interface AudioAtom extends BaseAtom {
  capability: 'audio';
  src: string;                     // 音频 URL
}
```

#### CodeAtom - 代码
```typescript
interface CodeAtom extends BaseAtom {
  capability: 'code';
  code: string;                    // 代码内容
  language?: string;               // 编程语言
}
```

#### IconAtom - 图标
```typescript
interface IconAtom extends BaseAtom {
  capability: 'icon';
  icon: string;                    // 图标名称
  size?: number;                   // 图标大小
}
```

#### CanvasAtom - 画布
```typescript
interface CanvasAtom extends BaseAtom {
  capability: 'canvas';
  width: number;                   // 画布宽度
  height: number;                  // 画布高度
  strokeColor?: [number, number, number];     // 画笔颜色
  strokeWidth?: number;            // 画笔宽度
  backgroundColor?: [number, number, number]; // 背景颜色
  blackboardStyle?: boolean;       // 黑板风格
  defaultColors?: [number, number, number][]; // 默认颜色数组
  defaultWidths?: number[];        // 默认线宽数组
  showToolbar?: boolean;            // 显示工具栏
  resizable?: boolean;             // 可调整大小
  minWidth?: number;               // 最小宽度
  minHeight?: number;              // 最小高度
}
```

### 装饰原子（修改容器外观）

#### BackgroundAtom - 背景
```typescript
interface BackgroundAtom extends BaseAtom {
  capability: 'background';
  color: [number, number, number]; // 背景颜色 RGB
  width?: number;                  // 背景宽度
  height?: number;                 // 背景高度
  radius?: number;                 // 圆角半径
}
```

#### BorderAtom - 边框
```typescript
interface BorderAtom extends BaseAtom {
  capability: 'border';
  width: number;                   // 边框宽度
  color: [number, number, number]; // 边框颜色 RGB
  radius?: number;                 // 圆角半径
  borderWidth?: number;            // 边框宽度（与 width 相同）
  borderHeight?: number;           // 边框高度
}
```

#### ShadowAtom - 阴影
```typescript
interface ShadowAtom extends BaseAtom {
  capability: 'shadow';
  x: number;                       // 阴影 X 偏移
  y: number;                       // 阴影 Y 偏移
  blur: number;                    // 模糊半径
  color: [number, number, number]; // 阴影颜色 RGB
  shadowWidth?: number;            // 阴影宽度
  shadowHeight?: number;           // 阴影高度
  radius?: number;                 // 圆角半径
}
```

### 动画原子（响应触发事件改变样式）

Trigger 触发类型：`'hover'` | `'click'` | `'drag'`

#### ScaleAtom - 缩放
```typescript
interface ScaleAtom extends BaseAtom {
  capability: 'scale';
  value: number;                   // 缩放值，如 1.2 表示放大 20%
  trigger: Trigger;                // 触发方式
}
```

#### OpacityAtom - 透明度
```typescript
interface OpacityAtom extends BaseAtom {
  capability: 'opacity';
  value: number;                   // 透明度 0-1
  trigger: Trigger;                // 触发方式
}
```

#### RotateAtom - 旋转
```typescript
interface RotateAtom extends BaseAtom {
  capability: 'rotate';
  value: number;                   // 旋转角度（度）
  trigger: 'hover' | 'click';      // 触发方式（不支持 drag）
}
```

#### TranslateAtom - 平移
```typescript
interface TranslateAtom extends BaseAtom {
  capability: 'translate';
  x: number;                       // X 轴平移距离
  y: number;                       // Y 轴平移距离
  trigger: 'drag';                 // 触发方式（仅支持 drag）
}
```

### 交互原子（响应用户交互）

#### DragAtom - 拖拽
```typescript
interface DragAtom extends BaseAtom {
  capability: 'drag';
  spring?: boolean;                // 是否使用弹性拖拽
}
```

#### ResizeAtom - 调整大小
```typescript
interface ResizeAtom extends BaseAtom {
  capability: 'resize';
  direction?: 'horizontal' | 'vertical' | 'both';  // 调整方向
}
```

#### ResizeHandleAtom - 缩放句柄
```typescript
interface ResizeHandleAtom extends BaseAtom {
  capability: 'resize-handle';
  edge?: 'nw' | 'ne' | 'sw' | 'se';              // 句柄位置
  minWidth?: number;                             // 最小宽度
  minHeight?: number;                            // 最小高度
  handleSize?: number;                           // 句柄大小
  handleColor?: [number, number, number];        // 句柄颜色
  scaleMode?: 'container' | 'proportional';     // 缩放模式
}
```

#### ScrollAtom - 滚动
```typescript
interface ScrollAtom extends BaseAtom {
  capability: 'scroll';
}
```

#### ClickAtom - 点击
```typescript
interface ClickAtom extends BaseAtom {
  capability: 'click';
}
```

### 布局原子

#### HeightAtom - 高度
```typescript
interface HeightAtom extends BaseAtom {
  capability: 'height';
  value: number;                   // 高度值
}
```

#### WidthAtom - 宽度
```typescript
interface WidthAtom extends BaseAtom {
  capability: 'width';
  value: number;                  // 宽度值
}
```

#### CollapseAtom - 折叠
```typescript
interface CollapseAtom extends BaseAtom {
  capability: 'collapse';
  groupId: string;                // 折叠组 ID
  collapsed: boolean;             // 是否折叠
}
```

---

## SubstanceManager

入口模块，负责初始化和协调。

### 使用方式

```typescript
// demo 端
import { SubstanceManager } from './dist/SubstanceManager.mjs';

const molecules = [...];
new SubstanceManager(molecules);  // 直接渲染，不返回任何东西
```

### 内部方法

```typescript
class SubstanceManager {
  private beakerManager: BeakerManager;

  constructor(molecules: Molecule[]) {
    const processedMolecules = this.process(molecules);
    this.beakerManager = new BeakerManager(processedMolecules);
  }

  private process(molecules: Molecule[]): Molecule[] {
    // 计算逻辑
  }
}
```

### 计算逻辑

#### 情况一：所有分子都没有设置 vertical 和 horizontal
- 跳过网格计算，保持原有 position 不变

#### 情况二：至少有一个分子设置了 vertical 或 horizontal
- 所有分子会吸附到最近的分子旁边
- **vertical 有设定，horizontal 没有**：吸附到 horizontal 最近的分子边，如果该行没有分子，按输入的 position.y 定义位置
- **horizontal 有设定，vertical 没有**：吸附到 vertical 最近的分子边，如果该列没有分子，按输入的 position.x 定义位置
- **两者都有**：按网格计算位置

#### Gap 默认值
- verticalGap 和 horizontalGap 没有定义时，默认 10px
- **仅在有分子设置了 vertical/horizontal 时生效**（自动排列场景）

#### 核心公式
```
x = (horizontal - 1) * (cellWidth + horizontalGap)
y = (vertical - 1) * (cellHeight + verticalGap)
```

---

## BeakerManager

分子管理器，实例类，由 SubstanceManager 创建，不对外导出。

### 职责

BeakerManager：
- 创建并管理多个 Beaker 实例
- 为每个 Beaker 分配唯一 ID
- 维护所有 Beaker 的状态
- 不创建自己的容器，Beaker 直接渲染到 document.body

### 状态管理

```typescript
interface BakerState {
  id: string;              // Beaker ID
  moleculeId: string;       // 分子 ID
  isHovered: boolean;      // 悬停状态
  isClicked: boolean;      // 点击状态
  isDragging: boolean;      // 拖拽状态
  position: { x: number; y: number };  // 当前位置
  collapsedGroups: Set<string>;  // 折叠组状态
}
```

### BakerState 字段详细说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | Beaker 实例的唯一标识符，格式为 `baker-{序号}`，如 `baker-0`、`baker-1` |
| moleculeId | string | 对应分子的 ID，与 molecule.id 一致 |
| isHovered | boolean | 鼠标是否悬停在分子容器上，通过 mouseenter/mouseleave 事件更新 |
| isClicked | boolean | 分子是否处于点击状态，通过 mousedown/mouseup 事件更新，支持切换 |
| isDragging | boolean | 分子是否正在被拖拽，通过拖拽交互过程中的 mousedown/mousemove/mouseup 更新 |
| position | { x: number; y: number } | 分子在页面上的绝对位置，初始值为 molecule.position，拖拽后会被更新 |
| collapsedGroups | Set\<string\> | 记录当前折叠组的折叠状态，Set 中的元素为 group ID，存在于 Set 中表示该组已折叠 |

### 公开方法

BeakerManager 提供以下公开方法用于查询和管理 Beaker 实例：

```typescript
class BeakerManager {
  // 查询方法
  
  // 根据 bakerId 获取单个 Beaker 实例
  getBaker(id: string): Beaker | undefined;
  
  // 获取所有 Beaker 实例
  getAllBakers(): Beaker[];
  
  // 根据 bakerId 获取单个 Beaker 的状态
  getBakerState(id: string): BakerState | undefined;
  
  // 获取所有 Beaker 的状态
  getAllBakerStates(): BakerState[];
  
  // 获取 Beaker 总数
  getBakerCount(): number;
  
  // 批量更新 baker 状态
  handleBakerStateChange(bakerId: string, state: Partial<BakerState>): void;
  
  // 操作方法
  
  // 更新指定 Beaker 的位置
  updateBakerPosition(bakerId: string, x: number, y: number): void;
}
```

#### 方法详细说明

| 方法 | 返回值 | 说明 |
|------|--------|------|
| getBaker(id) | Beaker \| undefined | 根据 bakerId（如 `baker-0`）查找并返回对应的 Beaker 实例，如果不存在返回 undefined |
| getAllBakers() | Beaker[] | 返回包含所有 Beaker 实例的数组，顺序与创建顺序一致 |
| getBakerState(id) | BakerState \| undefined | 根据 bakerId 获取对应 Beaker 的当前状态快照，包括位置、悬停、点击、拖拽等状态 |
| getAllBakerStates() | BakerState[] | 返回所有 Beaker 状态的数组，每个元素对应一个 BakerState |
| getBakerCount() | number | 返回当前管理的 Beaker 总数 |
| handleBakerStateChange(bakerId, state) | void | 当 Beaker 状态发生变化时调用，用于同步更新内部的 bakerStates Map |
| updateBakerPosition(bakerId, x, y) | void | 外部更新指定 Beaker 位置的快捷方法，内部调用 baker.updatePosition(x, y) |

---

## Beaker

单个分子渲染器，每个 molecule 对应一个 Beaker 实例。

### 职责

Beaker：
- 创建和管理单个分子的 DOM 容器
- 维护自己的 atoms 副本（运行时使用）
- 渲染所有原子
- 处理用户交互（悬停、点击、拖拽等）
- 向 BeakerManager 报告状态变化

### 状态报告

```typescript
type StateChangeCallback = (bakerId: string, state: Partial<BakerState>) => void;
```

当 Beaker 的状态发生变化时（如用户悬停、点击、拖拽），会调用回调函数通知 BeakerManager。

---

## AtomRenderer

原子渲染器，根据 atom 类型渲染对应 DOM。

### 支持的原子类型

| 类型 | 说明 |
|------|------|
| text | 文本渲染 |
| image | 图片渲染 |
| video | 视频渲染 |
| audio | 音频渲染 |
| code | 代码渲染 |
| icon | 图标渲染 |
| canvas | 画布渲染 |
| background | 背景填充 |
| border | 边框渲染 |
| shadow | 阴影效果 |
| scale | 缩放动画 |
| opacity | 透明度动画 |
| rotate | 旋转动画 |
| translate | 位移动画 |
| height | 高度动画 |
| width | 宽度动画 |
| collapse | 折叠动画 |
| drag | 拖拽交互 |
| resize | 缩放交互 |
| scroll | 滚动交互 |
| click | 点击交互 |
| resize-handle | 缩放句柄 |

### RenderResult 返回值

```typescript
interface RenderResult {
  id: string;           // 原子 ID
  success: boolean;     // 是否成功
  element?: HTMLElement; // 渲染的 DOM 元素
  error?: string;       // 错误信息（如果失败）
}
```

### 原子渲染行为

#### Content Atoms (text, image, video, audio, code, icon, canvas)
- 按 atom.position 定位，相对于分子容器坐标系
- 大小由内容决定或由 atom.size 指定

#### Decoration Atoms (background, border, shadow)
- 默认：position={x:0, y:0}，width=100%，height=100%
- 可自定义：用户可指定 position 和 size
- 不参与分子容器大小计算

### 原子类型完整列表

#### text
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'text' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| text | string | ✅ | 文本内容 |
| size | number | ✅ | 字体大小 |
| color | [r,g,b] | ✅ | 颜色 RGB |

#### image
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'image' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| src | string | ✅ | 图片地址 |
| width | number | ✅ | 宽度 |
| height | number | ✅ | 高度 |
| alt | string | ❌ | alt 文本 |

#### canvas
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'canvas' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| width | number | ✅ | 画布宽度 |
| height | number | ✅ | 画布高度 |
| strokeColor | [r,g,b] | ❌ | 画笔颜色，默认 [0, 0, 0] |
| strokeWidth | number | ❌ | 画笔宽度，默认 2 |
| blackboardStyle | boolean | ❌ | 黑板样式，默认 false |
| backgroundColor | [r,g,b] | ❌ | 画布背景色，仅在 blackboardStyle=false 时生效 |
| defaultColors | [r,g,b][] | ❌ | 工具栏默认颜色数组，默认 [[0,0,0], [255,0,0], [0,128,0], [0,0,255]] |
| defaultWidths | number[] | ❌ | 工具栏默认线宽数组，默认 [2, 4, 8] |
| showToolbar | boolean | ❌ | 是否显示工具栏，默认 true |
| resizable | boolean | ❌ | 是否可调整大小，默认 true |
| minWidth | number | ❌ | 调整大小时最小宽度，默认 100 |
| minHeight | number | ❌ | 调整大小时最小高度，默认 60 |

### Canvas 画布原子详细功能

Canvas 原子是一个功能丰富的交互式画布，支持自由绘图、橡皮擦、颜色选择、线宽调整、清除和缩放等功能。

#### 渲染结构

Canvas 原子渲染后生成以下 DOM 结构：

```
canvas-container (div)
  ├── canvas (HTMLCanvasElement) - 画布主体
  └── toolbar (div, optional) - 工具栏
       ├── color-buttons (button[]) - 颜色按钮组
       ├── width-buttons (button[]) - 线宽按钮组
       ├── eraser-button (button) - 橡皮擦按钮
       └── clear-button (button) - 清除按钮
```

- **canvas-container**: 绝对定位容器，包含画布和可选工具栏
- **canvas**: 实际的 HTML Canvas 元素，用于绑定鼠标/触摸事件和绘制图形
- **toolbar**: 浮动工具栏，提供绘图辅助功能

#### 绘图功能

1. **自由绘画**
   - 支持鼠标和触摸设备
   - 鼠标按下开始画笔，移动过程中实时绘制，释放结束
   - 每次绘画生成一个 stroke 对象，包含 points（点坐标数组）、color（颜色）、width（线宽）、isEraser（是否为橡皮擦）

2. **橡皮擦**
   - 切换橡皮擦模式后，绘制时使用背景色（黑板样式用 #2d5a2d，普通用 #ffffff）
   - 橡皮擦线宽为普通画笔的 3 倍

3. **颜色选择**
   - 点击颜色按钮切换画笔颜色
   - 支持自定义 defaultColors，默认提供黑、红、绿、蓝四种颜色

4. **线宽选择**
   - 点击线宽按钮切换画笔粗细
   - 支持自定义 defaultWidths，默认提供 2px、4px、8px 三种线宽

5. **清除全部**
   - 点击清除按钮清空所有笔画，重新绘制空白画布

#### 黑板样式 (blackboardStyle)

当 `blackboardStyle: true` 时：

- **背景色**: 深绿色 (#2d5a2d)，模拟黑板效果
- **纹理效果**: 随机添加半透明黑点，模拟粉笔纹理
- **工具栏样式**: 深绿色半透明背景 (#3a5a3a)
- **橡皮擦颜色**: #2d5a2d（背景色）

#### 缩放功能 (resizable)

当 `resizable: true`（默认）时：

1. **右下角缩放句柄**
   - 显示一个三角形 SVG 缩放图标
   - 颜色根据样式自适应（黑板样式使用浅绿色，普通使用灰色）

2. **缩放行为**
   - 拖拽缩放时显示虚线边框预览
   - 缩放后笔画会按比例重新绘制，保持原有图形
   - 触发 `canvas-resize` 自定义事件，事件 detail 包含新尺寸和原始 atom

3. **最小尺寸限制**
   - 由 `minWidth` 和 `minHeight` 控制，默认 100x60
   - 防止缩放过小导致画布无法使用

#### 样式计算

```typescript
// 容器样式
container.style.position = 'absolute';
container.style.left = `${atom.position?.x ?? 0}px`;
container.style.top = `${atom.position?.y ?? 0}px`;
container.style.zIndex = `${atom.position?.z ?? 10}`;
container.style.width = `${atom.width}px`;
container.style.height = `${atom.height}px`;

// 画布尺寸
canvas.width = atom.width;
canvas.height = atom.height;

// 背景处理
if (atom.blackboardStyle) {
  ctx.fillStyle = '#1a3a1a';  // 深绿色底色
  ctx.fillRect(0, 0, width, height);
  // 添加随机纹理...
} else if (atom.backgroundColor) {
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, width, height);
}
```

#### 事件系统

| 事件 | 触发时机 | detail 内容 |
|------|---------|------------|
| canvas-resize | 缩放完成后 | `{ width, height, atom }` |

#### 使用示例

```typescript
const canvasAtom = {
  capability: 'canvas',
  position: { x: 100, y: 50 },
  width: 400,
  height: 300,
  strokeColor: [0, 0, 255],
  strokeWidth: 3,
  blackboardStyle: false,
  defaultColors: [[0, 0, 0], [255, 0, 0], [0, 255, 0]],
  defaultWidths: [2, 4, 6, 8],
  showToolbar: true,
  resizable: true,
  minWidth: 200,
  minHeight: 150
};
```

#### scale / opacity / rotate / translate
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'scale'/'opacity'/'rotate'/'translate' | ✅ | 原子类型 |
| trigger | 'hover'/'click'/'drag' | ✅ | 触发方式 |
| value | number | ✅ | 目标值 |
| duration | number | ❌ | 动画时长（秒）|
