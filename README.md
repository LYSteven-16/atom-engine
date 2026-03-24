# AtomEngine

AtomEngine 是一个基于层级分解（原子/分子/物质）的纯 JavaScript 组件渲染引擎。它采用数据驱动架构，通过声明式配置生成复杂的交互式用户界面。

## 核心特性

- **零框架依赖**：仅依赖原生 JavaScript，可运行于任何现代浏览器
- **数据驱动渲染**：通过 JSON 配置声明界面，引擎自动处理 DOM 创建和交互
- **原子化设计**：组件由原子（Atom）组成，支持高度复用和组合
- **完整交互支持**：内置点击、拖拽、悬停、调整大小、滚动等交互原子
- **动画系统**：支持缩放、透明度、旋转、平移等 CSS 动画
- **样式装饰**：支持背景、边框、阴影等视觉装饰

## 快速开始

### 1. 安装

```bash
npm install @component-chemistry/atom-engine
```

### 2. 在 HTML 中引入

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
    import { SubstanceManager } from './dist/SubstanceManager.mjs';

    const molecules = [
      {
        id: 'my-first-molecule',
        position: { x: 100, y: 100 },
        atoms: [
          {
            capability: 'text',
            text: 'Hello AtomEngine!',
            size: 24,
            color: [51, 51, 51]
          }
        ]
      }
    ];

    const manager = new SubstanceManager(molecules);
    document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
  </script>
</body>
</html>
```

### 3. 构建项目

```bash
# 构建
npm run build

# 开发模式（监视文件变化）
npm run dev

# 类型检查
npm run typecheck
```

## 核心概念

### 物质（Substance）

物质是应用级别容器，管理所有分子（分子）：

```javascript
const substance = new SubstanceManager(molecules);
```

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

  // 文本内容
  text: '显示的文本内容',

  // 位置
  position: { x: 10, y: 10 },    // 相对于分子的偏移

  // 样式
  size: 16,                        // 字号（默认16）
  color: [51, 51, 51]             // 文字颜色（RGB数组）
};

// 示例：带样式的标题
{
  capability: 'text',
  text: 'Welcome',
  size: 32,
  color: [24, 144, 255],
  position: { x: 10, y: 10 }
}

// 示例：响应事件的文本（需要配合 ClickAtom）
{
  capability: 'text',
  text: 'Click me',
  size: 16,
  color: [0, 0, 0],
  position: { x: 10, y: 10 }
}
```

#### ImageAtom - 图片显示

显示图片资源，支持三种显示模式：

```javascript
const imageAtom = {
  capability: 'image',

  // 图片源
  src: 'https://example.com/image.png',

  // 尺寸
  width: 200,                      // 图片宽度
  height: 150,                     // 图片高度

  // 可选属性
  alt: '图片描述',                  // alt 文本
  position: { x: 0, y: 0 },       // 位置偏移

  // 显示模式（可选，默认 scroll）
  fitMode: 'scroll'               // 'scroll' | 'crop' | 'stretch'
};

// 示例：滚动模式（默认）- 可拖拽平移查看图片
{
  capability: 'image',
  src: 'https://example.com/big-image.png',
  width: 200,
  height: 150,
  fitMode: 'scroll'               // 默认模式，支持四方向拖拽
}

// 示例：裁切模式 - 图片填满容器，超出部分隐藏
{
  capability: 'image',
  src: 'https://example.com/image.png',
  width: 200,
  height: 150,
  fitMode: 'crop'                 // object-fit: cover
}

// 示例：拉伸模式 - 图片拉伸填充容器
{
  capability: 'image',
  src: 'https://example.com/image.png',
  width: 200,
  height: 150,
  fitMode: 'stretch'              // object-fit: fill
}

// 示例：带边框的头像
{
  capability: 'image',
  src: '/avatar.png',
  width: 80,
  height: 80,
  position: { x: 10, y: 10 }
}

// 注意：边框效果应作为独立的原子添加
// {
//   capability: 'border',
//   width: 3,
//   color: [24, 144, 255],
//   radius: 40
// }
```

#### VideoAtom - 视频播放

嵌入视频播放器：

```javascript
const videoAtom = {
  capability: 'video',

  // 视频源
  src: 'https://example.com/video.mp4',

  // 尺寸
  width: 640,
  height: 360,

  // 位置
  position: { x: 0, y: 0 }
};

// 示例：自动播放静音视频
{
  capability: 'video',
  src: '/background-video.mp4',
  width: 640,
  height: 360,
  position: { x: 0, y: 0 }
}
```

#### AudioAtom - 音频播放

嵌入音频播放器：

```javascript
const audioAtom = {
  capability: 'audio',

  // 音频源
  src: 'https://example.com/audio.mp3',

  // 位置
  position: { x: 0, y: 0 },

  // 尺寸
  width: 300,                      // 宽度（默认300）
  height: 42,                      // 高度（默认42）

  // 可选属性
  autoplay: false,                 // 自动播放
  loop: false,                     // 循环播放
  muted: false                     // 静音播放
};

// 示例：背景音乐
{
  capability: 'audio',
  src: '/bgm.mp3',
  position: { x: 0, y: 0 }
}
```

#### CodeAtom - 代码显示

显示代码片段，支持内联语法高亮（零外部依赖）、自动语言识别、自动格式化：

```javascript
const codeAtom = {
  capability: 'code',

  // 代码内容
  code: 'const hello = "world";',

  // 语言（用于语法高亮，可选，不填则自动识别）
  language: 'javascript',

  // 位置
  position: { x: 0, y: 0 },

  // 尺寸（可选）
  width: 400,                      // 宽度（默认400）
  height: 200,                     // 高度（默认200）

  // 背景颜色（可选，默认 [30, 30, 30]）
  backgroundColor: [30, 30, 30],

  // 自动格式化（可选，默认 true）
  // 自动整理乱序输入的代码为正确格式
  autoFormat: true,

  // 支持的语言：JavaScript/TypeScript/Python/Java/Go/Rust/HTML/CSS
};

// 示例：显示 TypeScript 代码
{
  capability: 'code',
  code: `interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}`,
  language: 'typescript',
  position: { x: 0, y: 0 }
}

// 示例：深色背景自定义颜色 + 自动格式化
{
  capability: 'code',
  code: 'def hello():    print("world")',
  language: 'python',
  backgroundColor: [20, 20, 30],
  autoFormat: true,
  position: { x: 0, y: 0 }
}
```

#### IconAtom - 图标显示

显示图标（emoji 或字体图标）：

```javascript
const iconAtom = {
  capability: 'icon',

  // 图标内容（emoji 或 HTML 实体）
  icon: '🚀',

  // 尺寸
  size: 32,

  // 位置
  position: { x: 0, y: 0 }
};

// 示例：多种图标
{
  capability: 'icon',
  icon: '⭐',
  size: 24,
  position: { x: 0, y: 0 }
}
```

#### CanvasAtom - 画布绘图

创建可绘图的画布，支持工具栏（画笔颜色/大小选择、橡皮擦、清空、保存为图片）：

```javascript
const canvasAtom = {
  capability: 'canvas',

  // 尺寸
  width: 400,
  height: 300,

  // 位置
  position: { x: 0, y: 0 },

  // 画布模式
  strokeColor: [0, 0, 0],           // 描边颜色（RGB数组）
  strokeWidth: 2,                   // 描边宽度
  backgroundColor: [255, 255, 255], // 背景颜色（RGB数组）

  // 黑板模式（绿色底白色笔）
  blackboardStyle?: boolean,

  // 预设颜色（工具栏颜色选择器）
  defaultColors?: [number, number, number][],

  // 预设线宽
  defaultWidths?: number[],

  // 显示工具栏
  showToolbar?: boolean,

  // 是否可调整大小
  resizable?: boolean,

  // 最小宽度
  minWidth?: number,

  // 最小高度
  minHeight?: number
};

// 示例：黑板画布
{
  capability: 'canvas',
  width: 600,
  height: 400,
  blackboardStyle: true,
  strokeColor: [255, 255, 255],
  strokeWidth: 3,
  position: { x: 0, y: 0 }
}

// 示例：带工具栏的可调整画布
{
  capability: 'canvas',
  width: 400,
  height: 300,
  strokeColor: [0, 0, 0],
  strokeWidth: 2,
  backgroundColor: [255, 255, 255],
  showToolbar: true,
  resizable: true,
  minWidth: 200,
  minHeight: 100,
  position: { x: 0, y: 0 }
}

// 示例：带预设颜色和线宽的工具栏
{
  capability: 'canvas',
  width: 400,
  height: 300,
  strokeColor: [50, 50, 50],
  strokeWidth: 3,
  showToolbar: true,
  resizable: true,
  defaultColors: [[0, 0, 0], [255, 0, 0], [0, 0, 255]],
  defaultWidths: [2, 4, 8],
  position: { x: 0, y: 0 }
}
```

### 输入原子

#### ClickAtom - 点击交互

处理鼠标点击事件：

```javascript
const clickAtom = {
  capability: 'click',

  // 点击回调
  onClick?: (e: MouseEvent) => void,

  // 双击回调
  onDoubleClick?: (e: MouseEvent) => void,

  // 鼠标按下/抬起
  onMouseDown?: (e: MouseEvent) => void,

  onMouseUp?: (e: MouseEvent) => void
};

// 示例：按钮点击
{
  capability: 'click',
  onClick: () => {
    console.log('按钮被点击');
  }
}

// 示例：双击编辑
{
  capability: 'click',
  onDoubleClick: () => {
    console.log('进入编辑模式');
  }
}
```

#### HoverAtom - 悬停交互

处理鼠标悬停事件：

```javascript
const hoverAtom = {
  capability: 'hover',

  // 鼠标进入容器回调
  onMouseEnter?: (e: MouseEvent) => void,

  // 鼠标离开容器回调
  onMouseLeave?: (e: MouseEvent) => void,

  // 悬停开始回调（鼠标进入）
  onHoverStart?: (e: MouseEvent) => void,

  // 悬停结束回调（鼠标离开）
  onHoverEnd?: (e: MouseEvent) => void
};

// 示例：显示提示
{
  capability: 'hover',
  onMouseEnter: (e) => {
    console.log('Mouse enter at', e.clientX, e.clientY);
  },
  onMouseLeave: (e) => {
    console.log('Mouse leave at', e.clientX, e.clientY);
  }
}
```

#### DragAtom - 拖拽交互

实现元素拖拽功能：

```javascript
const dragAtom = {
  capability: 'drag',

  // 拖拽手柄元素（可选，默认是整个容器）
  // 可以指定某个子元素作为拖拽手柄
  // handle: document.getElementById('drag-handle'),

  // 拖拽边界限制
  bounds: {
    x: 0,                           // 边界左上角 X
    y: 0,                           // 边界左上角 Y
    width: 1000,                     // 边界宽度
    height: 800                     // 边界高度
  },

  // 拖拽回调
  onDragStart?: (pos: { x: number; y: number }) => void,

  onDragMove?: (pos: { x: number; y: number }) => void,

  onDragEnd?: (pos: { x: number; y: number }) => void
};

// 示例：自由拖拽（无边界）
{
  capability: 'drag'
}

// 示例：受限拖拽
{
  capability: 'drag',
  bounds: {
    x: 0,
    y: 0,
    width: window.innerWidth - 100,
    height: window.innerHeight - 100
  },
  onDragEnd: (pos) => {
    console.log('Final position:', pos);
  }
}
```

#### ResizeAtom - 缩放交互

实现元素缩放功能：

```javascript
const resizeAtom = {
  capability: 'resize',

  // 最小宽度
  minWidth?: number,

  // 最大宽度
  maxWidth?: number,

  // 最小高度
  minHeight?: number,

  // 最大高度
  maxHeight?: number,

  // 缩放回调
  onResizeStart?: (size: { width: number; height: number }) => void,

  onResize?: (size: { width: number; height: number }) => void,

  onResizeEnd?: (size: { width: number; height: number }) => void
};

// 示例：自由缩放
{
  capability: 'resize'
}

// 示例：限制尺寸范围
{
  capability: 'resize',
  minWidth: 100,
  maxWidth: 500,
  minHeight: 100,
  maxHeight: 400,
  onResizeEnd: (size) => {
    console.log('Final size:', size);
  }
}
```

#### ResizeHandleAtom - 调整把手

为元素添加可视化的调整大小把手：

```javascript
const resizeHandleAtom = {
  capability: 'resize-handle',

  // 把手样式
  handleSize: 10,                   // 把手大小
  handleColor: [24, 144, 255],      // 把手颜色（RGB数组）

  // 把手位置（可选值：'nw' | 'ne' | 'sw' | 'se'）
  edge: 'se'
};

// 示例：四角调整把手
{
  capability: 'resize-handle',
  handleSize: 8,
  handleColor: [24, 144, 255],
  edge: 'se'
}

// 示例：仅右下角调整
{
  capability: 'resize-handle',
  handleSize: 10,
  edge: 'se'
}
```

#### ScrollAtom - 滚动交互

处理鼠标滚轮滚动事件：

```javascript
const scrollAtom = {
  capability: 'scroll',

  // 滚动方向限制（可选值：'horizontal' | 'vertical' | 'both'）
  // 注意：必须指定direction，否则不会启用滚动
  direction: 'vertical',              // 滚动方向

  // 滚动边界限制
  maxScrollX: 1000,                 // 最大水平滚动距离
  maxScrollY: 500,                 // 最大垂直滚动距离

  // 滚动回调
  onScroll: (pos) => {
    console.log('滚动位置:', pos);
  }
};

// 示例：仅垂直滚动
{
  capability: 'scroll',
  direction: 'vertical'
}

// 示例：仅水平滚动
{
  capability: 'scroll',
  direction: 'horizontal'
}
```

### 装饰原子

装饰原子各创建独立 DOM 元素，绝对定位，支持 position/width/height/radius。装饰最先渲染（底层），内容原子后渲染（上层）。

#### BackgroundAtom - 背景装饰

设置元素的背景样式，仅 background 可见，border/shadow 均透明：

```javascript
const backgroundAtom = {
  capability: 'background',

  // 背景颜色（RGB数组）
  color: [255, 255, 255],

  // 位置（可选）
  position: { x: 0, y: 0, z: 0 },

  // 元素尺寸（可选，默认继承分子宽高）
  width: 200,
  height: 100,

  // 圆角（可选，默认 molecule.radius ?? 12）
  radius: 12
};

// 示例：纯色背景卡片
{
  capability: 'background',
  color: [245, 248, 255],
  position: { x: 30, y: 90 },
  width: 150,
  height: 80,
  radius: 12
}
```

#### BorderAtom - 边框装饰

设置元素的边框样式，仅 border 可见，background/shadow 均透明：

```javascript
const borderAtom = {
  capability: 'border',

  // 边框粗细（与元素尺寸独立）
  borderWidth: 1,

  // 边框颜色（RGB数组）
  color: [217, 217, 217],

  // 位置（可选）
  position: { x: 0, y: 0, z: 0 },

  // 元素尺寸（可选，默认继承分子宽高）
  width: 200,
  height: 100,

  // 圆角（可选，默认 molecule.radius ?? 12）
  radius: 12
};

// 示例：3px红色边框卡片
{
  capability: 'border',
  borderWidth: 3,
  color: [255, 100, 100],
  position: { x: 30, y: 90 },
  width: 150,
  height: 80,
  radius: 12
}

// 示例：5px蓝色边框
{
  capability: 'border',
  borderWidth: 5,
  color: [100, 180, 255],
  position: { x: 220, y: 90 },
  width: 150,
  height: 80,
  radius: 20
}

// 示例：胶囊边框
{
  capability: 'border',
  borderWidth: 1,
  color: [255, 180, 100],
  position: { x: 220, y: 190 },
  width: 150,
  height: 80,
  radius: 30
}
```

#### ShadowAtom - 阴影装饰

设置元素的阴影效果，仅 box-shadow 可见，background/border 均透明：

```javascript
const shadowAtom = {
  capability: 'shadow',

  // 阴影偏移
  x: 0,
  y: 2,

  // 阴影模糊
  shadowBlur: 4,

  // 阴影宽度
  shadowWidth: 0,

  // 阴影颜色（RGB数组）
  color: [0, 0, 0],

  // 位置（可选）
  position: { x: 0, y: 0, z: -1 },

  // 元素尺寸（可选，默认继承分子宽高）
  width: 200,
  height: 100,

  // 圆角（可选，默认 molecule.radius ?? 12）
  radius: 12
};

// 示例：卡片阴影
{
  capability: 'shadow',
  color: [0, 0, 0],
  x: 3,
  y: 3,
  shadowBlur: 10
}

// 示例：蓝色悬浮阴影
{
  capability: 'shadow',
  color: [24, 144, 255],
  x: 0,
  y: 4,
  shadowBlur: 12
}
```

**圆角同步**：四个装饰原子（background/border/shadow）的 radius 默认取 `molecule.radius ?? 12`，可单独覆盖。
**分子容器**：完全透明，不承载任何样式，所有装饰由独立原子 DOM 实现。


### 动画原子

#### ScaleAtom - 缩放动画

控制元素的缩放效果：

```javascript
const scaleAtom = {
  capability: 'scale',

  // 缩放值
  value: 1,                         // 缩放比例

  // 触发方式
  trigger: 'hover' | 'click'        // 必须指定触发方式

  // 可选：动画时长
  duration?: number;
};

// 示例：悬停放大
{
  capability: 'scale',
  value: 1.1,
  trigger: 'hover'
}

// 示例：点击缩放
{
  capability: 'scale',
  value: 0.8,
  trigger: 'click'
}
```

#### OpacityAtom - 透明度动画

控制元素的透明度：

```javascript
const opacityAtom = {
  capability: 'opacity',

  // 触发条件
  trigger: 'hover',  // 'hover' | 'click'

  // 透明度值（0-1）
  value: 1
};

// 示例：悬停时半透明
{
  capability: 'opacity',
  trigger: 'hover',
  value: 0.5
}

// 示例：点击时淡出
{
  capability: 'opacity',
  trigger: 'click',
  value: 0
}
```

#### RotateAtom - 旋转动画

控制元素的旋转角度：

```javascript
const rotateAtom = {
  capability: 'rotate',

  // 触发条件
  trigger: 'hover',  // 'hover' | 'click'

  // 旋转角度（度）
  value: 0
};

// 示例：悬停时旋转45度
{
  capability: 'rotate',
  trigger: 'hover',
  value: 45
}

// 示例：点击时旋转90度
{
  capability: 'rotate',
  trigger: 'click',
  value: 90
}
```

#### TranslateAtom - 平移动画

控制元素的位移：

```javascript
const translateAtom = {
  capability: 'translate',

  // X 轴位移
  x: 0,

  // Y 轴位移
  y: 0
};

// 示例：向右下方移动
{
  capability: 'translate',
  x: 10,
  y: 10
}

// 示例：向左上方移动
{
  capability: 'translate',
  x: -20,
  y: -20
}
```

#### HeightAtom - 高度动画

动态控制元素高度：

```javascript
const heightAtom = {
  capability: 'height',

  // 高度值
  height: 100
};

// 示例：收起状态
{
  capability: 'height',
  height: 0
}

// 示例：自动高度
{
  capability: 'height',
  height: 'auto'
}
```

#### WidthAtom - 宽度动画

动态控制元素宽度：

```javascript
const widthAtom = {
  capability: 'width',

  // 宽度值
  width: 200
};

// 示例：展开宽度
{
  capability: 'width',
  width: 400
}
```

#### CollapseAtom - 折叠动画

控制元素的折叠状态：

```javascript
const collapseAtom = {
  capability: 'collapse',

  // 折叠分组名称（用于分组控制）
  group: 'group1',

  // 展开时的值（可选）
  expandedValue: 200,

  // 折叠时的值（可选）
  collapsedValue: 50,

  // 动画时长（可选）
  duration: 300
};

// 示例：默认折叠
{
  capability: 'collapse',
  group: 'accordion'
}

// 示例：带展开值的折叠
{
  capability: 'collapse',
  group: 'accordion',
  expandedValue: 200,
  duration: 300
}
```

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
        width: 1,
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
        capability: 'drag',
        onDragMove: (pos) => {
          console.log('拖拽中:', pos);
        }
      }
    ],
    width: 200,
    height: 120
  }
];

const manager = new SubstanceManager(molecules);
document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
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
        width: 1,
        color: [232, 232, 232],
        radius: 4
      },
      // 调整大小交互
      {
        capability: 'resize',
        minWidth: 200,
        maxWidth: 800,
        minHeight: 150,
        maxHeight: 600,
        onResize: (size) => {
          console.log('新尺寸:', size);
        }
      },
      // 调整把手
      {
        capability: 'resize-handle',
        handleSize: 8,
        handleColor: [24, 144, 255]
      }
    ]
  }
];

const manager = new SubstanceManager(molecules);
document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
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
        width: 1,
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
      // 折叠动画（点击会自动切换折叠状态）
      {
        capability: 'collapse',
        group: 'accordion',
        expandedValue: 200,
        collapsedValue: 50
      }
    ],
    width: 200,
    height: 200
  }
];

const manager = new SubstanceManager(molecules);
document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
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
        strokeWidth: 2
      },
      // 边框装饰
      {
        capability: 'border',
        width: 2,
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
document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
```

### 示例 5：多媒体展示面板

```javascript
const molecules = [
  {
    id: 'media-panel',
    position: { x: 50, y: 50 },
    atoms: [
      // 背景
      {
        capability: 'background',
        color: [26, 26, 46]
      },
      // 标题
      {
        capability: 'text',
        text: '多媒体展示',
        position: { x: 20, y: 20 },
        size: 24,
        color: [255, 255, 255]
      },
      // 视频
      {
        capability: 'video',
        src: 'https://example.com/video.mp4',
        position: { x: 20, y: 70 },
        width: 400,
        height: 225
      },
      // 音频
      {
        capability: 'audio',
        src: 'https://example.com/audio.mp3',
        position: { x: 20, y: 310 }
      }
    ],
    width: 440,
    height: 400
  }
];

const manager = new SubstanceManager(molecules);
document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
```

### 示例 6：交互式表单卡片

```javascript
const molecules = [
  {
    id: 'form-card',
    position: { x: 100, y: 100 },
    atoms: [
      // 卡片背景
      {
        capability: 'background',
        color: [255, 255, 255]
      },
      // 边框
      {
        capability: 'border',
        width: 1,
        color: [232, 232, 232],
        radius: 12
      },
      // 阴影
      {
        capability: 'shadow',
        color: [0, 0, 0],
        x: 0,
        y: 4,
        shadowBlur: 16
      },
      // 标题
      {
        capability: 'text',
        text: '用户信息',
        position: { x: 24, y: 24 },
        size: 20,
        color: [51, 51, 51]
      },
      // 用户名标签
      {
        capability: 'text',
        text: '用户名',
        position: { x: 24, y: 70 },
        size: 14,
        color: [102, 102, 102]
      },
      // 用户名输入占位
      {
        capability: 'text',
        text: '[输入框: username]',
        position: { x: 24, y: 95 },
        size: 14,
        color: [153, 153, 153]
      },
      // 邮箱标签
      {
        capability: 'text',
        text: '邮箱',
        position: { x: 24, y: 140 },
        size: 14,
        color: [102, 102, 102]
      },
      // 邮箱输入占位
      {
        capability: 'text',
        text: '[输入框: email]',
        position: { x: 24, y: 165 },
        size: 14,
        color: [153, 153, 153]
      },
      // 提交按钮背景
      {
        capability: 'background',
        color: [24, 144, 255],
        position: { x: 24, y: 220 }
      },
      // 提交按钮文本
      {
        capability: 'text',
        text: '提交',
        position: { x: 24, y: 220 },
        size: 14,
        color: [255, 255, 255]
      },
      // 按钮边框
      {
        capability: 'border',
        width: 0,
        radius: 4,
        position: { x: 24, y: 220 }
      },
      // 按钮点击交互
      {
        capability: 'click',
        onClick: () => {
          console.log('表单提交');
        }
      },
      // 按钮悬停效果
      {
        capability: 'hover',
        onMouseEnter: () => {
          console.log('鼠标进入按钮');
        },
        onMouseLeave: () => {
          console.log('鼠标离开按钮');
        }
      }
    ],
    width: 300,
    height: 300
  }
];

const manager = new SubstanceManager(molecules);
document.getElementById('app').appendChild(manager.getBakerManager().getBaker('baker-0').element);
```

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

### Molecule

分子配置接口：

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

**配置属性**：
- `id` - 唯一标识符（必需）
- `position` - 位置坐标（可选）
- `vertical` - 垂直网格行数（可选）
- `horizontal` - 水平网格列数（可选）
- `verticalGap` - 垂直间距（可选）
- `horizontalGap` - 水平间距（可选）
- `atoms` - 原子配置数组（必需）
- `width` - 宽度（可选）
- `height` - 高度（可选）
- `radius` - 圆角（可选）

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

当前版本尚未实现`destroy()`方法。如需移除分子，可直接从DOM中移除元素：

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
      text: 'New Molecule'
    }
  ]
};

const currentMolecules = [...existingMolecules, newMolecule];
manager.process(currentMolecules);
```

### Q: 如何实现自定义原子类型？

原子系统设计为可扩展的，你可以在项目中创建自定义原子：

```javascript
// 1. 创建原子类
class CustomAtom {
  static type = 'CustomAtom';

  static create(config, context) {
    const element = document.createElement('div');
    // 自定义逻辑
    return {
      element,
      update(newConfig) {
        // 更新逻辑
      },
      destroy() {
        // 清理逻辑
      }
    };
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

## 类型定义

完整的 TypeScript 类型定义已包含在包中：

```typescript
// 分子类型
interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };
  vertical?: number;
  horizontal?: number;
  verticalGap?: number;
  horizontalGap?: number;
  atoms: Atom[];
  width?: number;
  height?: number;
  radius?: number;
}

// 原子类型
type Atom = ContentAtom | InputAtom | DecorationAtom | AnimationAtom;

// 内容原子
type ContentAtom =
  | TextAtom
  | ImageAtom
  | VideoAtom
  | AudioAtom
  | CodeAtom
  | IconAtom
  | CanvasAtom;

// 输入原子
type InputAtom =
  | ClickAtom
  | DragAtom
  | HoverAtom
  | ResizeAtom
  | ResizeHandleAtom
  | ScrollAtom;

// 装饰原子
type DecorationAtom =
  | BackgroundAtom
  | BorderAtom
  | ShadowAtom;

// 动画原子
type AnimationAtom =
  | ScaleAtom
  | OpacityAtom
  | RotateAtom
  | TranslateAtom
  | HeightAtom
  | WidthAtom
  | CollapseAtom;

// Baker 状态
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
