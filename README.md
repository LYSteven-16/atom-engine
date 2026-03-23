# AtomEngine 原子引擎

> 纯 JavaScript 组件渲染引擎，无需任何框架依赖

## 特性

- **零依赖**: 纯原生 JavaScript，无框架依赖
- **原子化设计**: UI 组件拆分为最小单元「原子」，通过组合构建复杂界面
- **自动布局**: 支持相对定位和网格排列
- **声明式描述**: 用户描述"原子有什么表现"，而非"如何构建 CSS"
- **事件驱动**: 内置拖拽、缩放、点击等交互支持

## 快速开始

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; padding: 20px; }
  </style>
</head>
<body>
  <script type="module">
    import { SubstanceManager } from './dist/SubstanceManager.mjs';

    const molecules = [
      {
        id: 'mol-A',
        position: { x: 100, y: 100 },
        atoms: [
          { capability: 'background', color: [240, 240, 240], radius: 8 },
          { capability: 'border', width: 2, color: [200, 200, 200], radius: 8 },
          { capability: 'text', text: 'Hello World', size: 24, color: [51, 51, 51], position: { x: 20, y: 20 } }
        ]
      }
    ];

    new SubstanceManager(molecules);
  </script>
</body>
</html>
```

## ⚠️ 使用前检查 CSS

引擎依赖浏览器的 `left`/`top` 定位，宿主页面需确保：

```css
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
- 浏览器默认 `body { margin: 8px }` 会导致元素偏移
- 容器的 `margin: 0 auto` 居中会影响子元素定位基准
- `position: relative` 的祖先元素会作为定位参考

### 容器默认透明

引擎的分子容器（Beaker）默认保持完全透明，不添加任何可见样式。只有通过原子（如 `background`、`border`、`shadow`）显式添加装饰，内容才会可见。

```css
/* 容器默认样式 */
background: transparent;
border: none;
outline: none;
box-shadow: none;
```

## 核心理念

将 UI 组件拆分为最小单元「原子」，通过组合原子构建复杂界面。引擎自动处理渲染、样式、动画和交互。

**数据格式统一原则**：从 Demo 到引擎内部，数据格式完全一致，只有数据值变化。

```javascript
const molecules = [
  {
    id: 'mol-A',
    position: { x: 0, y: 0 },
    atoms: [...],
    vertical: 1,       // 网格垂直位置
    horizontal: 1,      // 网格水平位置
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

### 代码调用关系

```
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

### 渲染流程

```
1. demo 调用：new SubstanceManager(molecules)
2. SubstanceManager 构造函数执行：
   2.1 调用 this.process(molecules) 计算每个分子的 position
   2.2 创建 this.beakerManager = new BeakerManager(processedMolecules)
3. BeakerManager 构造函数执行：
   3.1 遍历 processedMolecules，对每个 molecule 创建 Beaker
   3.2 document.body.appendChild(baker.element)
4. Beaker 构造函数执行：
   4.1 创建 element，设置 position: absolute
   4.2 调用 this.init() 渲染所有原子
5. 渲染完成，页面显示完成
```

### 渲染位置

- **Beaker 渲染到页面**：渲染容器为 **document.body**，定位基准为页面左上角 (0, 0)
- **AtomRenderer 渲染到分子容器**：渲染容器为 **Beaker.element**，定位基准为分子容器左上角 (0, 0)

## 核心组件职责

| 组件 | 类型 | 职责 |
|------|------|------|
| **SubstanceManager** | 实例类，导出 | 入口点，布局计算 |
| **BeakerManager** | 实例类，非导出 | 管理多个 Beaker |
| **Beaker** | 实例类，非导出 | 单个分子渲染器 |
| **AtomRenderer** | 独立模块，非导出 | 原子渲染器 |

## API

### SubstanceManager

**仅导出此类**，其他类均为内部实现。

> **注意**：构建后生成的入口文件为 `dist/SubstanceManager.mjs`（注意不是 `index.mjs`）

```typescript
import { SubstanceManager } from './dist/SubstanceManager.mjs';

const molecules = [...];
new SubstanceManager(molecules);
```

构造函数 `new SubstanceManager(molecules: Molecule[])`：
- 计算每个分子的 position
- 创建 BeakerManager
- 自动渲染到页面
- 不返回任何值

## Molecule 分子

分子是原子的容器，也是渲染的基本单元。

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

原子是渲染的最小单元，分为四类：

- **内容原子**：渲染实际内容（文本、图片、视频等）
- **装饰原子**：修改容器外观（背景、边框、阴影）
- **动画原子**：响应触发事件改变样式
- **交互原子**：响应用户交互

### 属性可选性说明

原子的大部分属性都是**可选的**，使用 `?` 标记。未设置的属性会使用默认值或自动计算。

常见可选属性的默认值：
- `position`: 默认为 `{ x: 0, y: 0 }`
- `width`/`height` 等尺寸: 默认为父容器的 100%
- `radius`: 默认为 `0`（无圆角）
- `duration`: 默认为 `0`（无动画过渡）
- `z`: 默认为 `0`

### BaseAtom 通用属性

```typescript
interface BaseAtom {
  id?: string;                    // 原子 ID，可选
  position?: Position;            // 位置，相对于分子容器
  duration?: number;              // 动画时长（秒）
}

interface Position {
  x: number;
  y: number;
  z?: number;
}
```

### 内容原子

#### TextAtom - 文本
```typescript
interface TextAtom extends BaseAtom {
  capability: 'text';
  text: string;                    // 文本内容
  size: number;                    // 字体大小
  color: [number, number, number]; // RGB 颜色
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
  width?: number;
  height?: number;
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
  icon: string;                    // 图标名称/字符
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
  showToolbar?: boolean;           // 显示工具栏
  resizable?: boolean;             // 可调整大小
  minWidth?: number;               // 最小宽度
  minHeight?: number;              // 最小高度
}
```

### 装饰原子

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
  borderWidth?: number;            // 边框宽度
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

### 动画原子

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
  trigger: 'hover' | 'click';     // 触发方式（不支持 drag）
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

#### HeightAtom - 高度动画
```typescript
interface HeightAtom extends BaseAtom {
  capability: 'height';
  value: number;                   // 高度值
  trigger: 'click' | 'hover';
  collapsedValue?: number;         // 折叠时的高度
}
```

#### WidthAtom - 宽度动画
```typescript
interface WidthAtom extends BaseAtom {
  capability: 'width';
  value: number;                   // 宽度值
  trigger: 'click' | 'hover';
  collapsedValue?: number;        // 折叠时的宽度
}
```

#### CollapseAtom - 折叠
```typescript
interface CollapseAtom extends BaseAtom {
  capability: 'collapse';
  group: string;                   // 折叠组 ID
  expandedValue?: number;          // 展开时的高度
}
```

### 交互原子

#### DragAtom - 拖拽
```typescript
interface DragAtom extends BaseAtom {
  capability: 'drag';
  spring?: boolean;                // 是否使用弹性拖拽
  keepOnRelease?: boolean;        // 松开后是否保持位置
}
```

#### ResizeAtom - 调整大小
```typescript
interface ResizeAtom extends BaseAtom {
  capability: 'resize';
  direction?: 'horizontal' | 'vertical' | 'both';
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
  handleColor?: [number, number, number];       // 句柄颜色
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
  keepOnRelease?: boolean;         // 松开后是否保持状态
}
```

#### HoverAtom - 悬停
```typescript
interface HoverAtom extends BaseAtom {
  capability: 'hover';
  keepOnRelease?: boolean;         // 离开后是否保持状态
}
```

## keepOnRelease 属性

交互原子支持 `keepOnRelease` 属性，控制交互结束后状态是否保持：

| 原子类型 | keepOnRelease: true | keepOnRelease: false |
|----------|---------------------|----------------------|
| drag | 松开后保持新位置 | 松开后弹回原位 |
| click | 切换点击状态 | 点击后立即恢复 |
| hover | 鼠标离开后保持悬停效果 | 鼠标离开后恢复 |

```javascript
{ capability: 'scale', value: 1.2, trigger: 'click' },
{ capability: 'click', keepOnRelease: true }
```

## scaleMode 缩放模式

当 ResizeHandleAtom 的 scaleMode 为 `proportional` 时，内容自动等比缩放：

```javascript
position.x = originalX * (newWidth / initialWidth)
position.y = originalY * (newHeight / initialHeight)
width = originalWidth * (newWidth / initialWidth)
height = originalHeight * (newHeight / initialHeight)
size = originalSize * Math.min(ratioX, ratioY)
```

## 设计理念：描述表现，而非构建样式

AtomEngine 采用**声明式描述**而非**命令式构建**：

```javascript
{ capability: 'shadow', x: 4, y: 4, blur: 16, color: [0, 0, 0] }
```

用户只需描述**原子有什么表现**，引擎负责将描述转换为 CSS。这种设计：

1. **无需 CSS 知识**: 用户不需要学习 CSS 语法
2. **语义清晰**: `{ capability: 'shadow' }` 比 `box-shadow: 4px 4px 16px` 更易理解
3. **跨平台一致**: 同一份描述，在任何环境下渲染效果一致

## 容器透明化

> **重要**: 容器（Beaker）本身是**直角方形**（`border-radius: 0`），完全透明，不产生任何视觉输出。

AtomEngine 的容器默认设置为完全透明：
- `background: transparent`
- 无 box-shadow
- 无 border-radius

所有视觉效果（背景、边框、阴影、圆角）完全由原子负责渲染。

## 布局计算

### 情况一：所有分子都没有设置 vertical 和 horizontal
跳过网格计算，保持原有 position 不变。

### 情况二：至少有一个分子设置了 vertical 或 horizontal
所有分子会吸附到最近的分子旁边。

| 设置情况 | 行为 |
|----------|------|
| 仅 vertical | 吸附到 horizontal 最近的分子边 |
| 仅 horizontal | 吸附到 vertical 最近的分子边 |
| 两者都有 | 按网格计算位置 |

### Gap 默认值
- verticalGap 和 horizontalGap 没有定义时，默认 10px
- **仅在有分子设置了 vertical/horizontal 时生效**

### 核心公式
```
x = (horizontal - 1) * (cellWidth + horizontalGap)
y = (vertical - 1) * (cellHeight + verticalGap)
```

其中 cellWidth 和 cellHeight 默认为 100。

## License

MIT
