# AtomEngine

AtomEngine 是一个基于层级分解（原子/分子/物质）的纯 JavaScript 组件渲染引擎。它采用数据驱动架构，通过声明式配置生成复杂的交互式用户界面。

## 核心特性

- **零框架依赖**：仅依赖原生 JavaScript，可运行于任何现代浏览器
- **数据驱动渲染**：通过 JSON 配置声明界面，引擎自动处理 DOM 创建和交互
- **原子化设计**：组件由原子（Atom）组成，支持高度复用和组合
- **完整交互支持**：内置点击、拖拽、悬停、调整大小、滚动等交互原子
- **动画系统**：支持缩放、透明度、旋转、平移等 CSS 动画
- **样式装饰**：支持背景、边框、阴影等视觉装饰

## 项目结构

```
atom-engine/
├── src/
│   ├── SubstanceManager.ts      # 物质管理器（入口类）
│   ├── BeakerManager.ts         # 焙烤管理器
│   ├── Beaker.ts                # 焙烤器（核心组件）
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

## 安装

### 使用 npm 安装

```bash
npm install @component-chemistry/atom-engine
```

### 直接引入

```html
<script type="module">
  import { SubstanceManager } from './dist/SubstanceManager.mjs';
</script>
```

## 快速开始

### 1. 创建 HTML 容器

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AtomEngine Demo</title>
  <style>
    #app {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    // 引入 AtomEngine
  </script>
</body>
</html>
```

### 2. 定义分子配置

```javascript
const molecules = [
  {
    id: 'my-first-molecule',
    position: { x: 100, y: 100 },
    atoms: [
      // 背景装饰
      {
        capability: 'background',
        color: [255, 255, 255]
      },
      // 边框装饰
      {
        capability: 'border',
        borderWidth: 1,
        color: [220, 220, 220],
        radius: 12
      },
      // 文本内容
      {
        capability: 'text',
        text: 'Hello AtomEngine!',
        position: { x: 20, y: 20 },
        size: 24,
        color: [51, 51, 51]
      }
    ],
    width: 300,
    height: 100
  }
];
```

### 3. 创建 SubstanceManager 实例

```javascript
import { SubstanceManager } from '@component-chemistry/atom-engine';

const manager = new SubstanceManager(molecules);
```

### 4. 获取并添加到 DOM

```javascript
const baker = manager.getBakerManager().getBaker('baker-0');
document.getElementById('app').appendChild(baker.element);
```

## 核心概念

### 物质（Substance）

物质是应用级别容器，管理所有分子（Molecule）：

```javascript
const substance = new SubstanceManager(molecules);
```

**属性**：
- `molecules: Molecule[]` - 分子配置数组

**方法**：
- `getBakerManager()` - 获取 BeakerManager 实例

### 分子（Molecule）

分子是 UI 组件的基本单位：

```javascript
const molecule = {
  id: 'unique-molecule-id',        // 唯一标识符（必需）
  position: { x: 0, y: 0, z: 1 },  // 位置（可选）
  vertical: 1,                      // 垂直网格行数（可选）
  horizontal: 1,                    // 水平网格列数（可选）
  verticalGap: 10,                  // 垂直间距（可选）
  horizontalGap: 10,                 // 水平间距（可选）
  atoms: [],                         // 原子数组（必需）
  width: 200,                       // 宽度（可选）
  height: 100,                      // 高度（可选）
  radius: 8                         // 圆角（可选）
};
```

**接口定义**：
```typescript
interface Molecule {
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
```

### 原子（Atom）

原子是界面的最小单元，分为四类：

1. **内容原子**：显示文本、图片、视频等
2. **输入原子**：处理点击、拖拽、滚动等交互
3. **装饰原子**：设置背景、边框、阴影等样式
4. **动画原子**：控制元素的动态效果

## 原子类型详解

### 内容原子

#### TextAtom - 文本显示

在界面上显示文本内容：

```javascript
const textAtom = {
  capability: 'text',
  text: '显示的文本内容',
  position: { x: 10, y: 10 },
  size: 16,
  color: [51, 51, 51]
};
```

**配置属性**：
- `capability: 'text'` - 原子类型标识
- `text: string` - 文本内容（必需）
- `size: number` - 字号（默认 16）
- `color: [number, number, number]` - 文字颜色（RGB 数组）
- `position?: { x: number; y: number; z?: number }` - 位置

**实现细节**：
- 创建 `div` 元素作为文本容器
- 绝对定位在容器内指定位置
- 禁止用户选中和鼠标事件穿透

#### ImageAtom - 图片显示

显示图片资源：

```javascript
const imageAtom = {
  capability: 'image',
  src: 'https://example.com/image.png',
  width: 200,
  height: 150,
  alt: '图片描述',
  position: { x: 0, y: 0 }
};
```

**配置属性**：
- `capability: 'image'` - 原子类型标识
- `src: string` - 图片源（必需）
- `width: number` - 图片宽度
- `height: number` - 图片高度
- `alt?: string` - alt 文本
- `position?: { x: number; y: number; z?: number }` - 位置

#### VideoAtom - 视频播放

嵌入视频播放器：

```javascript
const videoAtom = {
  capability: 'video',
  src: 'https://example.com/video.mp4',
  width: 640,
  height: 360,
  position: { x: 0, y: 0 }
};
```

**配置属性**：
- `capability: 'video'` - 原子类型标识
- `src: string` - 视频源（必需）
- `width: number` - 视频宽度
- `height: number` - 视频高度
- `position?: { x: number; y: number; z?: number }` - 位置

#### AudioAtom - 音频播放

嵌入音频播放器：

```javascript
const audioAtom = {
  capability: 'audio',
  src: 'https://example.com/audio.mp3',
  position: { x: 0, y: 0 }
};
```

**配置属性**：
- `capability: 'audio'` - 原子类型标识
- `src: string` - 音频源（必需）
- `position?: { x: number; y: number; z?: number }` - 位置

#### CodeAtom - 代码显示

显示代码片段，支持内联语法高亮：

```javascript
const codeAtom = {
  capability: 'code',
  code: 'const hello = "world";',
  language: 'javascript',
  position: { x: 0, y: 0 },
  width: 400,
  height: 200,
  backgroundColor: [30, 30, 30],
  autoFormat: true
};
```

**配置属性**：
- `capability: 'code'` - 原子类型标识
- `code: string` - 代码内容（必需）
- `language?: string` - 语言（可选，用于语法高亮）
- `position?: { x: number; y: number; z?: number }` - 位置
- `width?: number` - 宽度（默认 400）
- `height?: number` - 高度（默认 200）
- `backgroundColor?: [number, number, number]` - 背景颜色（默认 [30, 30, 30]）
- `autoFormat?: boolean` - 自动格式化（默认 true）

**支持的语言**：JavaScript/TypeScript/Python/Java/Go/Rust/HTML/CSS

#### IconAtom - 图标显示

显示图标（emoji 或字体图标）：

```javascript
const iconAtom = {
  capability: 'icon',
  icon: '🚀',
  size: 32,
  position: { x: 0, y: 0 }
};
```

**配置属性**：
- `capability: 'icon'` - 原子类型标识
- `icon: string` - 图标内容（emoji 或 HTML 实体）（必需）
- `size: number` - 尺寸
- `position?: { x: number; y: number; z?: number }` - 位置

#### CanvasAtom - 画布绘图

创建可绘图的画布：

```javascript
const canvasAtom = {
  capability: 'canvas',
  width: 400,
  height: 300,
  position: { x: 0, y: 0 },
  strokeColor: [0, 0, 0],
  strokeWidth: 2,
  backgroundColor: [255, 255, 255],
  blackboardStyle: false,
  showToolbar: true,
  resizable: true,
  minWidth: 200,
  minHeight: 100
};
```

**配置属性**：
- `capability: 'canvas'` - 原子类型标识
- `width: number` - 宽度（必需）
- `height: number` - 高度（必需）
- `position?: { x: number; y: number; z?: number }` - 位置
- `strokeColor?: [number, number, number]` - 描边颜色（默认 [0, 0, 0]）
- `strokeWidth?: number` - 描边宽度（默认 2）
- `backgroundColor?: [number, number, number]` - 背景颜色
- `blackboardStyle?: boolean` - 黑板模式（绿色底白色笔）
- `defaultWidths?: number[]` - 预设线宽
- `showToolbar?: boolean` - 显示工具栏
- `resizable?: boolean` - 是否可调整大小
- `minWidth?: number` - 最小宽度
- `minHeight?: number` - 最小高度

**工具栏功能**：
- 画笔颜色选择器
- 画笔大小滑块
- 橡皮擦
- 清空画布
- 保存为图片

### 输入原子

#### ClickAtom - 点击交互

处理鼠标点击事件：

```javascript
const clickAtom = {
  capability: 'click',
  onClick: (e: MouseEvent) => {
    console.log('按钮被点击');
  },
  onDoubleClick: (e: MouseEvent) => {
    console.log('双击');
  }
};
```

**回调函数**：
- `onClick?: (e: MouseEvent) => void` - 单击回调
- `onDoubleClick?: (e: MouseEvent) => void` - 双击回调
- `onMouseDown?: (e: MouseEvent) => void` - 鼠标按下回调
- `onMouseUp?: (e: MouseEvent) => void` - 鼠标抬起回调

#### HoverAtom - 悬停交互

处理鼠标悬停事件：

```javascript
const hoverAtom = {
  capability: 'hover',
  onMouseEnter: (e: MouseEvent) => {
    console.log('鼠标进入');
  },
  onMouseLeave: (e: MouseEvent) => {
    console.log('鼠标离开');
  }
};
```

**回调函数**：
- `onMouseEnter?: (e: MouseEvent) => void` - 鼠标进入回调
- `onMouseLeave?: (e: MouseEvent) => void` - 鼠标离开回调
- `onHoverStart?: (e: MouseEvent) => void` - 悬停开始回调
- `onHoverEnd?: (e: MouseEvent) => void` - 悬停结束回调

#### DragAtom - 拖拽交互

实现元素拖拽功能：

```javascript
const dragAtom = {
  capability: 'drag',
  bounds: {
    x: 0,
    y: 0,
    width: 1000,
    height: 800
  }
};
```

**配置属性**：
- `capability: 'drag'` - 原子类型标识
- `handle?: HTMLElement` - 拖拽手柄元素（可选，默认整个容器）
- `bounds?: { x: number; y: number; width: number; height: number }` - 拖拽边界限制

**回调函数**：
- `onDragStart?: (pos: { x: number; y: number }) => void` - 拖拽开始
- `onDragMove?: (pos: { x: number; y: number }) => void` - 拖拽中
- `onDragEnd?: () => void` - 拖拽结束

#### ResizeAtom - 缩放交互

实现元素缩放功能：

```javascript
const resizeAtom = {
  capability: 'resize',
  minWidth: 100,
  maxWidth: 500,
  minHeight: 100,
  maxHeight: 400
};
```

**配置属性**：
- `capability: 'resize'` - 原子类型标识
- `minWidth?: number` - 最小宽度
- `maxWidth?: number` - 最大宽度
- `minHeight?: number` - 最小高度
- `maxHeight?: number` - 最大高度

**回调函数**：
- `onResizeStart?: (size: { width: number; height: number }) => void` - 调整开始
- `onResize?: (size: { width: number; height: number }) => void` - 调整中
- `onResizeEnd?: (size: { width: number; height: number }) => void` - 调整结束

#### ResizeHandleAtom - 调整把手

为元素添加可视化的调整大小把手：

```javascript
const resizeHandleAtom = {
  capability: 'resize-handle',
  handleSize: 10,
  handleColor: [24, 144, 255],
  edge: 'se',
  minWidth: 100,
  minHeight: 80
};
```

**配置属性**：
- `capability: 'resize-handle'` - 原子类型标识
- `handleSize?: number` - 把手大小
- `handleColor?: [number, number, number]` - 把手颜色
- `edge?: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'` - 把手位置
- `minWidth?: number` - 最小宽度
- `minHeight?: number` - 最小高度
- `scaleMode?: 'corner' | 'edge'` - 缩放模式

#### ScrollAtom - 滚动交互

处理鼠标滚轮滚动事件：

```javascript
const scrollAtom = {
  capability: 'scroll',
  direction: 'vertical',
  maxScrollX: 1000,
  maxScrollY: 500,
  onScroll: (pos) => {
    console.log('滚动位置:', pos);
  }
};
```

**配置属性**：
- `capability: 'scroll'` - 原子类型标识
- `direction: 'horizontal' | 'vertical' | 'both'` - 滚动方向（必需）
- `maxScrollX?: number` - 最大水平滚动距离
- `maxScrollY?: number` - 最大垂直滚动距离

**回调函数**：
- `onScroll?: (pos: { scrollX: number; scrollY: number }) => void` - 滚动回调

### 装饰原子

装饰原子各创建独立 DOM 元素，绝对定位，支持 position/width/height/radius。装饰最先渲染（底层），内容原子后渲染（上层）。

#### BackgroundAtom - 背景装饰

设置元素的背景样式：

```javascript
const backgroundAtom = {
  capability: 'background',
  color: [255, 255, 255],
  position: { x: 0, y: 0, z: 0 },
  width: 200,
  height: 100,
  radius: 12
};
```

**配置属性**：
- `capability: 'background'` - 原子类型标识
- `color: [number, number, number]` - 背景颜色（RGB 数组）
- `position?: { x: number; y: number; z?: number }` - 位置
- `width?: number` - 宽度
- `height?: number` - 高度
- `radius?: number` - 圆角

#### BorderAtom - 边框装饰

设置元素的边框样式：

```javascript
const borderAtom = {
  capability: 'border',
  borderWidth: 1,
  color: [217, 217, 217],
  position: { x: 0, y: 0, z: 0 },
  width: 200,
  height: 100,
  radius: 12
};
```

**配置属性**：
- `capability: 'border'` - 原子类型标识
- `borderWidth: number` - 边框粗细
- `color: [number, number, number]` - 边框颜色（RGB 数组）
- `position?: { x: number; y: number; z?: number }` - 位置
- `width?: number` - 宽度
- `height?: number` - 高度
- `radius?: number` - 圆角

#### ShadowAtom - 阴影装饰

设置元素的阴影效果：

```javascript
const shadowAtom = {
  capability: 'shadow',
  x: 0,
  y: 2,
  shadowBlur: 4,
  shadowWidth: 0,
  color: [0, 0, 0],
  position: { x: 0, y: 0, z: -1 },
  width: 200,
  height: 100,
  radius: 12
};
```

**配置属性**：
- `capability: 'shadow'` - 原子类型标识
- `x: number` - 阴影水平偏移
- `y: number` - 阴影垂直偏移
- `shadowBlur?: number` - 阴影模糊
- `shadowWidth?: number` - 阴影宽度
- `color: [number, number, number]` - 阴影颜色（RGB 数组）
- `position?: { x: number; y: number; z?: number }` - 位置
- `width?: number` - 宽度
- `height?: number` - 高度
- `radius?: number` - 圆角

### 动画原子

动画原子通过 `trigger` 属性响应输入原子的状态变化：
- `trigger: 'hover'` - 响应悬停状态
- `trigger: 'click'` - 响应点击状态
- `trigger: 'drag'` - 响应拖拽状态

#### ScaleAtom - 缩放动画

控制元素的缩放效果：

```javascript
const scaleAtom = {
  capability: 'scale',
  value: 1.2,
  trigger: 'hover',
  duration: 0.3,
  keepOnRelease: false
};
```

**配置属性**：
- `capability: 'scale'` - 原子类型标识
- `value: number` - 缩放比例（必需）
- `trigger: 'hover' | 'click'` - 触发方式（必需）
- `duration?: number` - 动画时长（秒，默认 0.15）
- `keepOnRelease?: boolean` - 松开后保持效果（默认 false）
- `defaultValue?: number` - 默认缩放值（默认 1）

**实现细节**：
- 使用 `requestAnimationFrame` 实现平滑动画
- 采用 ease-out 缓动函数
- 自动缩放所有子元素的位置、尺寸、字体、边框、阴影

#### OpacityAtom - 透明度动画

控制元素的透明度：

```javascript
const opacityAtom = {
  capability: 'opacity',
  value: 0.5,
  trigger: 'hover',
  duration: 0.2,
  keepOnRelease: false
};
```

**配置属性**：
- `capability: 'opacity'` - 原子类型标识
- `value: number` - 透明度值（0-1，必需）
- `trigger: 'hover' | 'click'` - 触发方式（必需）
- `duration?: number` - 动画时长（秒，默认 0.15）
- `keepOnRelease?: boolean` - 松开后保持效果（默认 false）

#### RotateAtom - 旋转动画

控制元素的旋转角度：

```javascript
const rotateAtom = {
  capability: 'rotate',
  value: 45,
  trigger: 'hover',
  duration: 0.3,
  keepOnRelease: false
};
```

**配置属性**：
- `capability: 'rotate'` - 原子类型标识
- `value: number` - 旋转角度（度，必需）
- `trigger: 'hover' | 'click'` - 触发方式（必需）
- `duration?: number` - 动画时长（秒，默认 0.15）
- `keepOnRelease?: boolean` - 松开后保持效果（默认 false）

#### TranslateAtom - 平移动画

控制元素的位移（仅响应拖拽）：

```javascript
const translateAtom = {
  capability: 'translate',
  trigger: 'drag',
  keepOnRelease: false
};
```

**配置属性**：
- `capability: 'translate'` - 原子类型标识
- `trigger: 'drag'` - 触发方式（必需，仅支持 'drag'）
- `keepOnRelease?: boolean` - 松开后保持位置（默认 false）

#### HeightAtom - 高度动画

动态控制元素高度：

```javascript
const heightAtom = {
  capability: 'height',
  value: 200,
  trigger: 'click',
  collapsedValue: 50,
  duration: 0.3,
  keepOnRelease: true
};
```

**配置属性**：
- `capability: 'height'` - 原子类型标识
- `value: number` - 展开高度值（必需）
- `trigger: 'hover' | 'click'` - 触发方式（必需）
- `collapsedValue?: number` - 折叠高度值
- `duration?: number` - 动画时长（秒，默认 0.15）
- `keepOnRelease?: boolean` - 松开后保持效果（默认 false）

#### WidthAtom - 宽度动画

动态控制元素宽度：

```javascript
const widthAtom = {
  capability: 'width',
  value: 300,
  trigger: 'click',
  collapsedValue: 100,
  duration: 0.3,
  keepOnRelease: true
};
```

**配置属性**：
- `capability: 'width'` - 原子类型标识
- `value: number` - 展开宽度值（必需）
- `trigger: 'hover' | 'click'` - 触发方式（必需）
- `collapsedValue?: number` - 折叠宽度值
- `duration?: number` - 动画时长（秒，默认 0.15）
- `keepOnRelease?: boolean` - 松开后保持效果（默认 false）

#### CollapseAtom - 折叠动画

控制元素的折叠状态：

```javascript
const collapseAtom = {
  capability: 'collapse',
  group: 'accordion',
  expandedValue: 200,
  collapsedValue: 50,
  duration: 0.3
};
```

**配置属性**：
- `capability: 'collapse'` - 原子类型标识
- `group: string` - 折叠分组名称（必需）
- `expandedValue?: number` - 展开时的值
- `collapsedValue?: number` - 折叠时的值
- `duration?: number` - 动画时长（秒）

## API 参考

### SubstanceManager

应用入口类，管理所有分子：

```typescript
class SubstanceManager {
  constructor(molecules: Molecule[]);
  getBakerManager(): BeakerManager;
}
```

**构造函数参数**：
- `molecules: Molecule[]` - 分子配置数组

**方法**：
- `getBakerManager()` - 获取 BeakerManager 实例

### BeakerManager

管理所有 Beaker 实例：

```typescript
class BeakerManager {
  constructor(molecules: Molecule[]);
  getBaker(id: string): Beaker | undefined;
  getAllBakers(): Beaker[];
  getBakerState(id: string): BakerState | undefined;
  getAllBakerStates(): BakerState[];
  getBakerCount(): number;
}
```

**方法**：
- `getBaker(id)` - 获取指定 Baker（ID 格式为 `baker-${index}`，如 `baker-0`）
- `getAllBakers()` - 获取所有 Baker（返回数组）
- `getBakerState(id)` - 获取指定 Baker 的状态
- `getAllBakerStates()` - 获取所有 Baker 的状态（返回数组）
- `getBakerCount()` - 获取 Baker 数量

### Beaker

分子的运行时表示：

```typescript
class Beaker {
  readonly id: string;
  readonly molecule: Molecule;
  readonly element: HTMLElement;
  readonly bakerIndex: number;
  state: BakerState;

  constructor(id: string, molecule: Molecule, bakerIndex: number, onStateChange?: StateChangeCallback);
  getState(): BakerState;
  updateState(newState: Partial<BakerState>): void;
  updatePosition(x: number, y: number): void;
  updateHoverState(isHovered: boolean): void;
  updateClickState(isClicked: boolean): void;
  updateDragStart(pos: { x: number; y: number }): void;
  updateDragMove(pos: { x: number; y: number }): void;
  updateDragEnd(): void;
  updateResizeStart(size: { width: number; height: number }): void;
  updateResizeMove(size: { width: number; height: number }): void;
  updateResizeEnd(size: { width: number; height: number }): void;
  updateScrollState(scrollX?: number, scrollY?: number): void;
}
```

**属性**：
- `id` - Baker 实例 ID
- `molecule` - 关联的分子配置对象
- `element` - DOM 容器元素
- `bakerIndex` - Baker 在 SubstanceManager 中的索引
- `state` - 当前状态

**方法**：
- `getState()` - 获取当前状态的副本
- `updateState(newState)` - 更新状态并触发回调
- `updatePosition(x, y)` - 更新位置并同步 DOM
- `updateHoverState(isHovered)` - 更新悬停状态
- `updateClickState(isClicked)` - 更新点击状态
- `updateDragStart(pos)` - 开始拖拽
- `updateDragMove(pos)` - 拖拽中
- `updateDragEnd()` - 结束拖拽
- `updateResizeStart(size)` - 开始调整大小
- `updateResizeMove(size)` - 调整大小中
- `updateResizeEnd(size)` - 结束调整大小
- `updateScrollState(scrollX, scrollY)` - 更新滚动状态

### BakerState

Baker 的状态对象：

```typescript
interface BakerState {
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

**状态属性**：
- `id` - 状态 ID
- `moleculeId` - 关联的分子 ID
- `isHovered` - 是否悬停
- `isClicked` - 是否点击
- `isDragging` - 是否拖拽中
- `isResizing` - 是否调整大小中
- `position` - 位置坐标（x, y）
- `width?` - 宽度（可选）
- `height?` - 高度（可选）
- `scrollX?` - 水平滚动位置（可选）
- `scrollY?` - 垂直滚动位置（可选）
- `collapsedGroups` - 折叠组状态（Set 集合）

## 完整示例

### 示例 1：可拖拽卡片

```javascript
const molecules = [
  {
    id: 'draggable-card',
    position: { x: 100, y: 100 },
    atoms: [
      // 背景装饰
      {
        capability: 'background',
        color: [255, 255, 255]
      },
      // 边框装饰
      {
        capability: 'border',
        borderWidth: 1,
        color: [232, 232, 232],
        radius: 8
      },
      // 阴影装饰
      {
        capability: 'shadow',
        color: [0, 0, 0],
        x: 0,
        y: 2,
        shadowBlur: 8
      },
      // 标题文本
      {
        capability: 'text',
        text: '可拖拽卡片',
        position: { x: 20, y: 20 },
        size: 18,
        color: [51, 51, 51]
      },
      // 描述文本
      {
        capability: 'text',
        text: '拖拽此卡片到任意位置',
        position: { x: 20, y: 50 },
        size: 14,
        color: [102, 102, 102]
      },
      // 拖拽交互
      {
        capability: 'drag'
      },
      // 平移动画（响应拖拽）
      {
        capability: 'translate',
        trigger: 'drag'
      }
    ],
    width: 200,
    height: 120
  }
];

const manager = new SubstanceManager(molecules);
const baker = manager.getBakerManager().getBaker('baker-0');
document.getElementById('app').appendChild(baker.element);
```

### 示例 2：可调整大小的图片展示

```javascript
const molecules = [
  {
    id: 'resizable-image',
    position: { x: 50, y: 50 },
    atoms: [
      // 图片内容
      {
        capability: 'image',
        src: 'https://picsum.photos/400/300',
        width: 400,
        height: 300,
        alt: '示例图片'
      },
      // 边框装饰
      {
        capability: 'border',
        borderWidth: 1,
        color: [232, 232, 232],
        radius: 4
      },
      // 调整大小交互
      {
        capability: 'resize',
        minWidth: 200,
        maxWidth: 800,
        minHeight: 150,
        maxHeight: 600
      },
      // 调整把手
      {
        capability: 'resize-handle',
        handleSize: 8,
        handleColor: [24, 144, 255],
        edge: 'se'
      }
    ]
  }
];

const manager = new SubstanceManager(molecules);
const baker = manager.getBakerManager().getBaker('baker-0');
document.getElementById('app').appendChild(baker.element);
```

### 示例 3：带动画的可折叠列表

```javascript
const molecules = [
  {
    id: 'collapsible-list',
    position: { x: 100, y: 100 },
    atoms: [
      // 列表背景
      {
        capability: 'background',
        color: [245, 245, 245]
      },
      // 边框
      {
        capability: 'border',
        borderWidth: 1,
        color: [232, 232, 232],
        radius: 8
      },
      // 列表标题
      {
        capability: 'text',
        text: '点击展开/收起',
        position: { x: 20, y: 20 },
        size: 16,
        color: [51, 51, 51]
      },
      // 内容项 1
      {
        capability: 'text',
        text: '列表项 1',
        position: { x: 20, y: 60 },
        size: 14,
        color: [102, 102, 102]
      },
      // 内容项 2
      {
        capability: 'text',
        text: '列表项 2',
        position: { x: 20, y: 90 },
        size: 14,
        color: [102, 102, 102]
      },
      // 内容项 3
      {
        capability: 'text',
        text: '列表项 3',
        position: { x: 20, y: 120 },
        size: 14,
        color: [102, 102, 102]
      },
      // 点击交互
      {
        capability: 'click'
      },
      // 折叠动画（点击会自动切换折叠状态）
      {
        capability: 'collapse',
        group: 'accordion',
        expandedValue: 200,
        collapsedValue: 50,
        duration: 0.3
      }
    ],
    width: 200,
    height: 200
  }
];

const manager = new SubstanceManager(molecules);
const baker = manager.getBakerManager().getBaker('baker-0');
document.getElementById('app').appendChild(baker.element);
```

### 示例 4：画板应用

```javascript
const molecules = [
  {
    id: 'drawing-board',
    position: { x: 50, y: 50 },
    atoms: [
      // 画布
      {
        capability: 'canvas',
        width: 800,
        height: 600,
        strokeColor: [0, 0, 0],
        strokeWidth: 2,
        showToolbar: true,
        resizable: true
      },
      // 边框装饰
      {
        capability: 'border',
        borderWidth: 2,
        color: [51, 51, 51],
        radius: 4
      },
      // 阴影
      {
        capability: 'shadow',
        color: [0, 0, 0],
        x: 0,
        y: 4,
        shadowBlur: 12
      }
    ]
  }
];

const manager = new SubstanceManager(molecules);
const baker = manager.getBakerManager().getBaker('baker-0');
document.getElementById('app').appendChild(baker.element);
```

### 示例 5：悬停缩放按钮

```javascript
const molecules = [
  {
    id: 'hover-button',
    position: { x: 100, y: 100 },
    atoms: [
      // 按钮背景
      {
        capability: 'background',
        color: [24, 144, 255]
      },
      // 按钮边框
      {
        capability: 'border',
        borderWidth: 0,
        radius: 8
      },
      // 按钮阴影
      {
        capability: 'shadow',
        color: [24, 144, 255],
        x: 0,
        y: 4,
        shadowBlur: 12
      },
      // 按钮文本
      {
        capability: 'text',
        text: '悬停缩放',
        position: { x: 30, y: 15 },
        size: 16,
        color: [255, 255, 255]
      },
      // 悬停交互
      {
        capability: 'hover'
      },
      // 缩放动画
      {
        capability: 'scale',
        value: 1.1,
        trigger: 'hover',
        duration: 0.2
      },
      // 透明度动画
      {
        capability: 'opacity',
        value: 0.9,
        trigger: 'hover',
        duration: 0.2
      }
    ],
    width: 120,
    height: 50
  }
];

const manager = new SubstanceManager(molecules);
const baker = manager.getBakerManager().getBaker('baker-0');
document.getElementById('app').appendChild(baker.element);
```

## 构建项目

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式（监视文件变化）
npm run dev

# 类型检查
npm run typecheck
```

## 常见问题

### Q: 如何获取分子的当前状态？

```javascript
const baker = manager.getBakerManager().getBaker('baker-0');
const state = baker.getState();
console.log(state.position, state.width, state.height);
```

### Q: 如何更新分子的状态？

```javascript
const baker = manager.getBakerManager().getBaker('baker-0');
baker.updateState({
  position: { x: 200, y: 100 },
  width: 300,
  height: 200
});
```

### Q: 如何处理原子之间的状态共享？

```javascript
const baker = manager.getBakerManager().getBaker('baker-0');
baker.updateState({
  customData: { sharedValue: 'test' }
});
// 在原子回调中访问
const state = baker.getState();
console.log(state.customData?.sharedValue);
```

### Q: 如何销毁不再需要的分子？

当前版本尚未实现 `destroy()` 方法。如需移除分子，可直接从 DOM 中移除元素：

```javascript
const baker = manager.getBakerManager().getBaker('baker-0');
if (baker) {
  baker.element.remove();
}
```

### Q: 如何动态添加新的分子？

```javascript
const newMolecule = {
  id: 'new-molecule',
  position: { x: 300, y: 200 },
  atoms: [
    {
      capability: 'text',
      text: 'New Molecule',
      size: 16,
      color: [51, 51, 51]
    }
  ]
};

// 重新创建 SubstanceManager
const currentMolecules = [...existingMolecules, newMolecule];
const newManager = new SubstanceManager(currentMolecules);
```

### Q: 如何实现自定义原子类型？

原子系统设计为可扩展的，你可以在项目中创建自定义原子：

```typescript
// 1. 创建原子类
class CustomAtom {
  readonly capability = 'custom';
  readonly context: AtomContext;

  constructor(context: AtomContext, element: HTMLElement, config: any) {
    this.context = context;
    // 自定义逻辑
  }
}

// 2. 在分子中使用
const molecule = {
  id: 'custom-molecule',
  atoms: [
    {
      capability: 'custom',
      // 自定义配置
    }
  ]
};
```

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 更新日志

### v3.0.0
- 全新架构重构
- 支持 TypeScript
- 优化渲染性能
- 增加新的原子类型
- 完善文档和示例

### v2.0.0
- 支持 ES Module
- 增加动画系统
- 完善交互功能

### v1.0.0
- 初始版本发布
- 基础渲染功能
- 核心原子类型

## 许可证

MIT License
