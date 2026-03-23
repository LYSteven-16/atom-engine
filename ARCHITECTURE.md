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

// AtomEngine.render(molecules)
// SubstanceManager.process(molecules) 计算后
// BakerManager 接收 - 格式完全一致
```

## 架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Demo                                        │
│                   (直接写 molecules 数组)                                │
│                                                                          │
│   const molecules = [                                                    │
│     { id: 'A', atoms: [...], vertical:1, horizontal:1, verticalGap:10 }, │
│     { id: 'B', atoms: [...], vertical:1, horizontal:2, verticalGap:10 },│
│     ...                                                                  │
│   ]                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                         SubstanceManager                                 │
│                              (纯计算)                                    │
│                                                                          │
│   输入：molecules[] (含 vertical、horizontal、gap)                          │
│   处理：根据 vertical、horizontal、gap 计算每个分子的 position              │
│   输出：molecules[] (position 已计算，vertical、horizontal、gap 保留)      │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ for each molecule:                                               │   │
│   │   x = (molecule.horizontal - 1) * (cellWidth + molecule.horizontalGap)   │
│   │   y = (molecule.vertical - 1) * (cellHeight + molecule.verticalGap)       │
│   │   molecule.position = { x, y }                                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                           BeakerManager                                  │
│                          (每个 molecule 一个实例)                         │
│                                                                          │
│   运行时维护自己的 atoms 副本，不再访问原始 molecule 数据                    │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ constructor(molecule)                                            │   │
│   │   1. 创建 DOM 容器                                               │   │
│   │   2. 复制 molecule.atoms 到 this.atoms                           │   │
│   │   3. 调用 init()                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ init()                                                           │   │
│   │   1. setupElement() - 设置容器样式                                │   │
│   │   2. decomposeAndRender() - 分解原子并渲染                        │   │
│   │   3. attachEventListeners() - 绑定事件                           │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ decomposeAndRender()                                             │   │
│   │   1. Catalyst.decompose(this.atoms) → 分离 atoms               │   │
│   │   2. 根据 content atoms 计算容器大小                              │   │
│   │   3. 设置容器大小和位置                                           │   │
│   │   4. AtomRenderer.render() → 渲染每个 atom                      │   │
│   │   5. setupInputHandlers() → 设置输入处理                         │   │
│   │   6. setupResizeHandlers() → 设置缩放处理                        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   运行时：BeakerManager 使用 this.atoms 响应用户输入                         │
│   用户拖拽/缩放后，直接修改 this.atoms，重新渲染                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           独立组件                                       │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                           Catalyst                               │   │
│   │                         (独立模块)                                │   │
│   │                                                                  │   │
│   │   输入: atoms[]                                                   │   │
│   │   输出: { renderable: Atom[], others: Atom[] }                   │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         AtomRenderer                             │   │
│   │                        (独立模块)                                │   │
│   │                                                                  │   │
│   │   输入: atom                                                       │   │
│   │   输出: RenderResult { id, success, element?, error? }           │   │
│   │   行为: 按 atom.position 渲染到分子容器内                            │   │
│   │        相对于分子容器的坐标系                                      │   │
│   │        每个元素用 data-atom-id 标记                                │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 初始化 vs 运行时

#### 初始化阶段（一次）

```
Demo → SubstanceManager.process() → BeakerManager(molecule) → init()
                                              ↓
                                    ┌────────────────────┐
                                    │ 1. 复制 atoms       │
                                    │ 2. decomposeAndRender │
                                    │ 3. 渲染完成          │
                                    └────────────────────┘
```

#### 运行时阶段

```
用户输入 → BeakerManager 处理 → 修改 this.atoms → 重新渲染
                              ↑
                    不再访问原始 molecule 数据
```

### 核心组件职责

| 组件 | 职责 | 说明 |
|------|------|------|
| **SubstanceManager** | 纯计算 | 接收 molecules，计算 position，返回格式一致的数据 |
| **BeakerManager** | 分子容器 | 创建 DOM 容器，渲染 molecule，管理布局位置，维护运行时 atoms 副本 |
| **Catalyst** | 原子分类器 | 分解分子中的原子，分类管理 |
| **AtomRenderer** | 原子渲染器 | 根据原子类型渲染对应 DOM 元素，返回 RenderResult |

---

## Molecule 分子

分子是原子的容器，也是渲染的基本单元。

### Molecule 结构

```typescript
interface Molecule {
  id: string;
  position: { x: number; y: number; z?: number };  // 绝对位置
  vertical?: number;       // 网格垂直位置
  horizontal?: number;     // 网格水平位置
  verticalGap?: number;     // 与上下分子的间距，默认 10
  horizontalGap?: number;  // 与左右分子的间距，默认 10
  width?: number;          // 分子宽度
  height?: number;         // 分子高度
  atoms: Atom[];
}
```

### Atom 原子

原子是渲染的最小单元。

```typescript
type Atom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom |
  BackgroundAtom | BorderAtom | ShadowAtom |
  ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom |
  DragAtom | ResizeAtom | ScrollAtom | ClickAtom |
  HeightAtom | WidthAtom | CollapseAtom;
```

---

## SubstanceManager

纯计算模块，负责布局计算。

### 输入输出

```typescript
// 输入：Demo 直接写的 molecules
const input: Molecule[] = [...]

// 输出：计算后的 molecules，格式完全一致
const output: Molecule[] = SubstanceManager.process(input)
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

分子管理器，每个 molecule 对应一个实例。

### 职责

BeakerManager：
- 创建 DOM 容器
- 维护自己的 atoms 副本（运行时使用）
- 调用 Catalyst 拆解
- 渲染 atoms

### 运行时特性

1. 构造函数接收 Molecule，复制 atoms 到 this.atoms
2. setupElement() - 创建容器，设置大小
3. decomposeAndRender() - 调用 Catalyst，渲染 atoms
4. attachEventListeners() - 绑定事件

### RenderResult

AtomRenderer.render() 返回 RenderResult：

```typescript
interface RenderResult {
  id: string;           // 原子 ID
  success: boolean;     // 是否成功
  element?: HTMLElement; // 渲染的 DOM 元素
  error?: string;       // 错误信息（如果失败）
}
```

---

## Catalyst 催化剂

原子分类器，将 molecule 中的 atoms 分离。

### decompose 方法

```typescript
decompose(
  atoms: Atom[],
  moleculePosition?: Position
): { renderable: ContentAtom[]; others: Atom[] }
```

### BaseAtom 通用属性

所有原子都继承自 BaseAtom：

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | string | ❌ | 原子唯一标识 |
| position | {x, y, z?} | ❌ | 位置 |
| duration | number | ❌ | 动画时长（秒），默认 0.15 |

### 分类规则

- **ContentAtom**: text, image, video, audio, code, icon
- **DecorationAtom**: background, border, shadow
- **AnimationAtom**: scale, opacity, rotate, translate, height, width, collapse
- **InputAtom**: drag, resize, scroll, click

---

## AtomRenderer

原子渲染器，根据 atom 类型渲染对应 DOM。

### 支持的原子类型

| 类型 | 说明 |
|------|------|
| text | 文本渲染 |
| image | 图片渲染 |
| background | 背景填充 |
| border | 边框渲染 |
| shadow | 阴影效果 |
| ... | ... |

### RenderResult 返回值

```typescript
const result = AtomRenderer.render(atom);
if (result.success) {
  console.log(`Atom ${result.id} rendered successfully`);
  container.appendChild(result.element);
} else {
  console.error(`Failed to render ${result.id}: ${result.error}`);
}
```

### 原子渲染行为

#### Content Atoms (text, image, video, audio, code, icon)
- 按 atom.position 定位，相对于分子容器坐标系
- 大小由内容决定或由 atom.size 指定

#### Decoration Atoms (background, border, shadow)
- 默认：position={x:0, y:0}，width=100%，height=100%
- 可自定义：用户可指定 position 和 size
- 不参与分子容器大小计算

#### 示例

```javascript
// 使用默认 decoration
{ capability: 'background', color: [255, 0, 0] }
// 渲染为 position: {x:0,y:0}, size: {width: 100%, height: 100%}

// 自定义 decoration
{
  capability: 'background',
  position: { x: 10, y: 10 },
  size: { width: 50, height: 50 },
  color: [255, 0, 0]
}
```

---

## 原子类型完整列表

### Content Atoms

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

#### video
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'video' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| src | string | ✅ | 视频地址 |
| width | number | ❌ | 宽度 |
| height | number | ❌ | 高度 |

#### audio
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'audio' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| src | string | ✅ | 音频地址 |

#### code
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'code' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| code | string | ✅ | 代码内容 |
| language | string | ❌ | 语言类型 |

#### icon
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'icon' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| icon | string | ✅ | 图标名称 |
| size | number | ❌ | 图标大小 |

#### canvas
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'canvas' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| width | number | ✅ | 画布宽度 |
| height | number | ✅ | 画布高度 |
| strokeColor | [r,g,b] | ❌ | 画笔颜色，默认 [0,0,0] |
| strokeWidth | number | ❌ | 画笔粗细，默认 2 |
| backgroundColor | [r,g,b] | ❌ | 画布背景色 |
| blackboardStyle | boolean | ❌ | 黑板风格，会渲染深绿色带纹理的背景和内阴影 |
| defaultColors | [r,g,b][] | ❌ | 工具栏可选颜色，默认 [[0,0,0],[255,0,0],[0,128,0],[0,0,255]] |
| defaultWidths | number[] | ❌ | 工具栏可选粗细，默认 [2,4,8] |
| showToolbar | boolean | ❌ | 是否显示工具栏，默认 true |

**黑板风格特性**：
- 自动生成深绿色 (#2d5a2d) 带纹理的黑板背景
- 提供内阴影效果增强立体感
- 默认画笔颜色为浅绿色，适合在黑板上书写
- 橡皮擦会恢复黑板背景色
- 清除功能会重新生成黑板纹理

---

### Decoration Atoms

#### background
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'background' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| color | [r,g,b] | ✅ | 背景颜色 |
| width | number | ❌ | 宽度，默认 100% |
| height | number | ❌ | 高度，默认 100% |
| radius | number | ❌ | 圆角半径，会与 border 原子统一 |

#### border
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'border' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| width | number | ✅ | 边框宽度 |
| color | [r,g,b] | ✅ | 边框颜色 |
| radius | number | ❌ | 圆角半径，会与 background 原子统一 |
| borderWidth | number | ❌ | 容器宽度，默认 100% |
| borderHeight | number | ❌ | 容器高度，默认 100% |

#### 圆角统一规则
> BeakerManager 在渲染时会自动统一 background、border 和 shadow 的圆角：
> - 如果只设置了 background 或 border 其一的 radius，另一个自动同步
> - shadow 会自动同步 background/border 的圆角值
> - 如果都没有设置 radius，则都设为 0

#### shadow
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'shadow' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| x | number | ✅ | 阴影 X 偏移 |
| y | number | ✅ | 阴影 Y 偏移 |
| blur | number | ✅ | 模糊距离 |
| color | [r,g,b] | ✅ | 阴影颜色 |
| shadowWidth | number | ❌ | 容器宽度，默认 100% |
| shadowHeight | number | ❌ | 容器高度，默认 100% |
| radius | number | ❌ | 圆角，自动同步 background/border 的圆角 |
| trigger | 'hover' | ❌ | 悬停时修改静态阴影的 boxShadow（不渲染独立元素） |

---

### Animation Atoms

#### scale
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'scale' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| value | number | ✅ | 缩放比例 |
| trigger | 'hover'\|'click'\|'drag' | ✅ | 触发方式 |

#### opacity
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'opacity' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| value | number | ✅ | 透明度 0-1 |
| trigger | 'hover'\|'click'\|'drag' | ✅ | 触发方式 |

#### rotate
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'rotate' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| value | number | ✅ | 旋转角度 |
| trigger | 'hover'\|'click' | ✅ | 触发方式 |

#### translate
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'translate' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| x | number | ✅ | X 偏移量 |
| y | number | ✅ | Y 偏移量 |
| trigger | 'drag' | ✅ | 触发方式 |

#### height
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'height' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| value | number | ✅ | 高度值 |
| trigger | 'click'\|'hover' | ✅ | 触发方式 |
| collapsedValue | number | ❌ | 折叠时高度 |

#### width
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'width' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| value | number | ✅ | 宽度值 |
| trigger | 'click'\|'hover' | ✅ | 触发方式 |
| collapsedValue | number | ❌ | 折叠时宽度 |

#### collapse
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'collapse' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| group | string | ✅ | 分组名称 |
| collapsedValue | number | ❌ | 折叠值 |
| expandedValue | number | ❌ | 展开值 |

---

### Input Atoms

#### drag
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'drag' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| spring | boolean | ❌ | 拖拽结束后是否回弹，默认 true（回弹）；设为 false 时，拖拽位置会累积，不会跳回原位 |

#### resize
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'resize' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |
| direction | 'horizontal'\|'vertical'\|'both' | ❌ | 调整方向 |

#### scroll
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'scroll' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |

#### click
| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| capability | 'click' | ✅ | 原子类型 |
| position | {x, y, z?} | ❌ | 位置，默认 {0,0} |

---

## 渲染流程

```
1. Demo 构建 molecules 数组
       ↓
2. SubstanceManager.process(molecules)
   - 根据 vertical、horizontal 计算 position
   - 根据 gap 计算间距
       ↓
3. 遍历 molecules，创建 BeakerManager
       ↓
4. BeakerManager 接收 molecule
   - 复制 molecule.atoms 到 this.atoms
       ↓
5. BeakerManager.setupElement()
   - 创建 div 容器
   - 计算并设置大小和位置
       ↓
6. BeakerManager.decomposeAndRender()
   - Catalyst.decompose() 分离 atoms
   - AtomRenderer.render() 渲染每个 atom
   - 处理 RenderResult
       ↓
7. 运行时：BeakerManager 使用 this.atoms 响应用户输入
```
