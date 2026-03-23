# AtomEngine 原子引擎

> 纯 JavaScript 组件渲染引擎，无需任何框架依赖

## 特性

- **零依赖**: 纯原生 JavaScript，无框架依赖
- **原子化设计**: UI 组件拆分为最小单元「原子」，通过组合构建复杂界面
- **化学隐喻**: 原子(Atom) → 分子(Molecule) → 化合物(Compound)
- **自动布局**: 支持相对定位和自动缩放
- **事件驱动**: 内置拖拽、缩放、点击等交互支持
- **声明式描述**: 用户描述"原子有什么表现"，而非"如何构建CSS"

## 安装

```bash
npm install @component-chemistry/atom-engine
```

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
  <div id="app"></div>
  <script type="module">
    import { AtomEngine, SubstanceManager, BeakerManager } from './dist/index.mjs';

    const molecules = [
      {
        id: 'test-molecule',
        position: { x: 100, y: 100 },
        width: 300,
        height: 200,
        atoms: [
          { capability: 'background', color: [240, 240, 240] },
          { capability: 'border', width: 2, color: [200, 200, 200], radius: 8 },
          { capability: 'resize-handle', edge: 'se', minWidth: 150, minHeight: 100, handleSize: 16 },
          { capability: 'text', text: 'Hello World', size: 24, color: [51, 51, 51], position: { x: 20, y: 20 } }
        ]
      }
    ];

    const processed = SubstanceManager.process(molecules);
    const app = document.getElementById('app');

    processed.forEach(molecule => {
      const beaker = new BeakerManager(molecule);
      app.appendChild(beaker.getElement());
    });
  </script>
</body>
</html>
```

## 核心概念

### 数据流架构

```
┌─────────────┐
│    Demo     │  编写 molecules 数据
└──────┬──────┘
       ↓
┌──────┴──────┐
│SubstanceManager│ 计算布局位置
└──────┬──────┘
       ↓
┌──────┴──────┐
│ BeakerManager │ 渲染分子，维护运行时状态
└──────┬──────┘
       ↓
┌──────┴──────┐
│   Catalyst   │ 分解原子
└──────┬──────┘
       ↓
┌──────┴──────┐
│ AtomRenderer │ 渲染原子，返回 RenderResult
└─────────────┘
```

### 初始化阶段（一次）

1. Demo → SubstanceManager.process() → 计算 position
2. BeakerManager 接收 molecule
3. BeakerManager 复制 atoms 到内部状态
4. 调用 Catalyst.decompose() 分解原子
5. 调用 AtomRenderer.render() 渲染

### 运行时阶段

BeakerManager 使用自己的内部状态响应用户输入，不再访问原始 molecule 数据。

### 渲染结果

AtomRenderer.render() 返回 RenderResult：

```typescript
interface RenderResult {
  id: string;           // 原子 ID，用于标识渲染目标
  success: boolean;      // 渲染是否成功
  element?: HTMLElement; // 渲染的 DOM 元素
  error?: string;       // 错误信息（如果失败）
}
```

## 原子类型

### Content Atoms

| 类型 | 说明 | 必需属性 |
|------|------|----------|
| text | 文本 | text, size, color |
| image | 图片 | src, width, height |
| video | 视频 | src |
| audio | 音频 | src |
| code | 代码 | code |
| icon | 图标 | icon |
| canvas | 画布 | width, height |

### Decoration Atoms

| 类型 | 说明 |
|------|------|
| background | 背景填充 |
| border | 边框 |
| shadow | 阴影 |

### Animation Atoms

| 类型 | 说明 | 触发 |
|------|------|------|
| scale | 缩放 | hover, click, drag |
| opacity | 透明度 | hover, click, drag |
| rotate | 旋转 | hover, click |
| translate | 位移 | drag |
| height | 高度 | hover, click |
| width | 宽度 | hover, click |
| collapse | 折叠 | click |

### Input Atoms

| 类型 | 说明 |
|------|------|
| drag | 拖拽 |
| resize | 调整大小 |
| scroll | 滚动 |
| click | 点击 |

### 特殊原子

| 类型 | 说明 |
|------|------|
| resize-handle | 缩放手柄 |

## ResizeHandle 缩放手柄

```javascript
{
  capability: 'resize-handle',
  edge: 'se',           // 位置: 'nw' | 'ne' | 'sw' | 'se'
  minWidth: 100,        // 最小宽度
  minHeight: 80,       // 最小高度
  handleSize: 16,      // 手柄大小
  handleColor: [180, 180, 190], // 手柄颜色
  scaleMode: 'proportional'  // 缩放模式
}
```

### scaleMode

- `container`: 仅拉伸容器，内容不变
- `proportional` (默认): 内容自动等比缩放

### 自动布局公式

当 scaleMode 为 `proportional` 时：

```javascript
// 位置
position.x = originalX * (newWidth / initialWidth)
position.y = originalY * (newHeight / initialHeight)

// 大小
width = originalWidth * (newWidth / initialWidth)
height = originalHeight * (newHeight / initialHeight)

// 文字大小（等比缩放）
size = originalSize * Math.min(ratioX, ratioY)
```

## API

### AtomEngine

```typescript
import { AtomEngine, SubstanceManager, BeakerManager } from '@component-chemistry/atom-engine';
```

### SubstanceManager

```typescript
// 处理 molecules 布局
const processed = SubstanceManager.process(molecules: Molecule[]): Molecule[]
```

### BeakerManager

```typescript
const beaker = new BeakerManager(molecule: Molecule)
beaker.getElement(): HTMLElement
```

### AtomRenderer

```typescript
const renderer = new AtomRenderer()
const result = renderer.render(atom: Atom): RenderResult
```

### Catalyst

```typescript
const { renderable, others } = Catalyst.decompose(atoms: Atom[])
// renderable: ContentAtom[] - 可渲染的原子
// others: Atom[] - 装饰、动画、输入等原子
```

## 设计理念：描述表现，而非构建样式

AtomEngine 采用**声明式描述**而非**命令式构建**：

```javascript
// 描述"我想要一个阴影"
{ capability: 'shadow', x: 4, y: 4, blur: 16, color: [0, 0, 0, 0.15] }
```

用户只需描述**原子有什么表现**，引擎负责将描述转换为CSS样式。这种设计：

1. **无需CSS知识**: 用户不需要学习CSS语法
2. **语义清晰**: `{ capability: 'shadow' }` 比 `box-shadow: 4px 4px 16px` 更易理解
3. **跨平台一致**: 同一份描述，在任何环境下渲染效果一致

## 容器透明化

> ⚠️ **重要**: 容器（Beaker）本身是**直角方形**（`border-radius: 0`），完全透明，不产生任何视觉输出。

AtomEngine 的容器默认设置为完全透明：

- `background: transparent` - 背景透明
- 无 box-shadow - 无阴影
- **无 border-radius - 容器本身是直角方形**

所有视觉效果（背景、边框、阴影、圆角）完全由原子（background、border、shadow）负责渲染。

### 视觉错乱排查

当出现以下问题时，请优先检查容器设置：

- ❌ **圆角处出现白色/透明缺口** → 检查容器是否为直角，确认原子是否正确设置圆角
- ❌ **阴影位置偏移** → 检查容器位置是否正确
- ❌ **背景超出圆角** → 检查 background 原子的 radius 是否与 border/shadow 一致

这种设计确保：

1. **原子化纯粹**: 容器的所有属性完全由原子控制
2. **行为一致**: 不论容器内容如何变化，容器本身不会产生视觉干扰
3. **可预测性**: 开发者可以精确控制每个视觉元素

## BaseAtom 通用属性

所有原子都继承 BaseAtom：

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 原子唯一标识 |
| position | {x, y, z?} | 位置 |
| duration | number | 动画时长（秒） |

## CSS 要求

引擎依赖 `left`/`top` 定位：

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

## License

MIT
