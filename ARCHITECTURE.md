# 原子引擎架构

## 核心概念

### 原子 (Atom)

单一能力的最小单位，每个原子只能拥有一个能力。

**原子结构**：

```typescript
type Atom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom |
            BackgroundAtom | BorderAtom | ShadowAtom |
            ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom |
            DragAtom | ResizeAtom | ScrollAtom | ClickAtom |
            GapAtom | ContainerAtom;

interface TextAtom {
  capability: 'text';
  position: { x: number; y: number; z?: number };
  text: string;
  size: number;
  color: [number, number, number];
}

interface ImageAtom {
  capability: 'image';
  position: { x: number; y: number; z?: number };
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface VideoAtom {
  capability: 'video';
  position: { x: number; y: number; z?: number };
  src: string;
  width?: number;
  height?: number;
}

interface AudioAtom {
  capability: 'audio';
  position: { x: number; y: number; z?: number };
  src: string;
}

interface CodeAtom {
  capability: 'code';
  position: { x: number; y: number; z?: number };
  code: string;
  language?: string;
}

interface IconAtom {
  capability: 'icon';
  position: { x: number; y: number; z?: number };
  icon: string;
  size?: number;
}

interface BackgroundAtom {
  capability: 'background';
  position: { x: number; y: number; z?: number };
  color: [number, number, number];
}

interface BorderAtom {
  capability: 'border';
  position: { x: number; y: number; z?: number };
  width: number;
  color: [number, number, number];
  radius?: number;
}

interface ShadowAtom {
  capability: 'shadow';
  position: { x: number; y: number; z?: number };
  x: number;
  y: number;
  blur: number;
  color: [number, number, number];
}

interface ScaleAtom {
  capability: 'scale';
  position?: { x: number; y: number; z?: number };
  value: number;
  trigger: 'hover' | 'click' | 'drag';
}

interface OpacityAtom {
  capability: 'opacity';
  position?: { x: number; y: number; z?: number };
  value: number;
  trigger: 'hover' | 'click' | 'drag';
}

interface RotateAtom {
  capability: 'rotate';
  position?: { x: number; y: number; z?: number };
  value: number;
  trigger: 'hover' | 'click';
}

interface TranslateAtom {
  capability: 'translate';
  position?: { x: number; y: number; z?: number };
  x: number;
  y: number;
  trigger: 'drag';
}

interface DragAtom {
  capability: 'drag';
  position?: { x: number; y: number; z?: number };
}

interface ResizeAtom {
  capability: 'resize';
  position?: { x: number; y: number; z?: number };
  direction?: 'horizontal' | 'vertical' | 'both';
}

interface ScrollAtom {
  capability: 'scroll';
  position?: { x: number; y: number; z?: number };
}

interface ClickAtom {
  capability: 'click';
  position?: { x: number; y: number; z?: number };
}

interface GapAtom {
  capability: 'gap';
  position: { x: number; y: number; z?: number };
  size: number;
}

interface ContainerAtom {
  capability: 'container';
  position: { x: number; y: number; z?: number };
}
```

**注意**：所有原子都必须包含 `position` 字段，表示该原子在分子容器内的相对位置。

**原子结构示例**：
```typescript
const textAtom: TextAtom = {
  capability: 'text',
  position: { x: 10, y: 20, z: 1 },
  text: 'Hello World',
  size: 16,
  color: [0, 0, 0],
};

const imageAtom: ImageAtom = {
  capability: 'image',
  position: { x: 0, y: 0 },
  src: '/cat.jpg',
  width: 200,
  height: 200,
};

const backgroundAtom: BackgroundAtom = {
  capability: 'background',
  position: { x: 0, y: 0 },
  color: [255, 255, 255],
};

const borderAtom: BorderAtom = {
  capability: 'border',
  position: { x: 0, y: 0 },
  width: 1,
  color: [229, 229, 229],
  radius: 12,
};

const shadowAtom: ShadowAtom = {
  capability: 'shadow',
  position: { x: 0, y: 0 },
  x: 0,
  y: 2,
  blur: 8,
  color: [0, 0, 0],
};

const scaleAtom: ScaleAtom = {
  capability: 'scale',
  value: 1.05,
  trigger: 'hover',
};

const clickAtom: ClickAtom = {
  capability: 'click',
};
```

### 分子 (Molecule)

由多个原子组合而成的功能组件。

**分子结构**：

```typescript
interface Molecule {
  id: string;
  position?: { x: number; y: number; z?: number };  // 分子在页面中的绝对位置
  atoms: Atom[];
}
```

**位置关系**：

- `Molecule.position` → 分子在页面中的绝对位置
- `Atom.position` → 原子在分子容器内的相对位置

### 原子引擎 (AtomEngine)

核心渲染入口，通过 BeakerManager 调控整个引擎。

**组件层级**：

```
BeakerManager (状态管理员)
    ├── 接收分子数据
    ├── 调用 Catalyst 分类原子
    ├── 管理状态（动画、交互、展开/折叠）
    └── 调用 AtomRenderer 渲染原子
        ↓
Catalyst (催化剂)
    └── decompose(atoms) - 分类原子
        ↓
AtomRenderer (原子渲染器)
    └── 根据 capability 渲染每个原子
```

## 化学实验室隐喻

| 组件              | 隐喻   | 职责               |
| --------------- | ---- | ---------------- |
| `AtomEngine`    | 引擎入口 | 导出 BeakerManager |
| `BeakerManager` | 管理员  | 调控整个引擎，状态管理      |
| `Catalyst`      | 催化剂  | 拆解分子，分类原子        |
| `AtomRenderer`  | 反应器  | 根据原子类型渲染         |

## 数据流

```
Demo (分子信息)
    ↓ 传入 molecule
BeakerManager
    ├── 调用 Catalyst.decompose(molecule.atoms, molecule.position)
    │       ↓
    │   1. 计算原子绝对坐标: atomPosition + moleculePosition
    │   2. 返回 { renderable: ContentAtom[] (带绝对坐标), others }
    │
    ├── 分析 others 原子类型
    │   ├── DecorationAtom → 容器样式
    │   ├── AnimationAtom → 动画状态管理
    │   └── InputAtom → 事件绑定
    │
    ├── 根据原子 trigger 建立状态监听
    │   ├── hover → onMouseEnter / onMouseLeave
    │   ├── click → onClick
    │   └── drag → mousedown / mousemove / mouseup
    │
    ├── 根据状态变化更新容器样式
    │
    └── 调用 AtomRenderer 渲染 renderable 原子（使用绝对坐标）
            ↓
        视觉效果
```

**注意**：

- Demo 只存储分子信息，不接触 Catalyst / AtomRenderer
- BeakerManager 通过 Catalyst 获知分子需要哪些状态管理
- BeakerManager 根据拆解结果自动管理所需状态
- **坐标转换由 Catalyst 完成**：原子的相对位置 + 分子的绝对位置 = 原子的绝对位置

## 原子分类

### 1. 内容原子 (ContentAtom)

内容原子是 Atom 类型中 capability 为 `text | image | video | audio | code | icon` 的原子。

| 原子    | 参数                                 | 说明 |
| ----- | ---------------------------------- | -- |
| text  | position, text, size, color        | 文本 |
| image | position, src, width, height, alt? | 图片 |
| video | position, src, width?, height?     | 视频 |
| audio | position, src                      | 音频 |
| code  | position, code, language?          | 代码 |
| icon  | position, icon, size?              | 图标 |

### 2. 装饰原子 (DecorationAtom)

装饰原子是 Atom 类型中 capability 为 `background | border | shadow` 的原子。

| 原子         | 参数                              | 说明  |
| ---------- | ------------------------------- | --- |
| background | position, color                 | 背景色 |
| border     | position, width, color, radius? | 边框  |
| shadow     | position, x, y, blur, color     | 阴影  |

### 3. 动画原子 (AnimationAtom)

动画原子是 Atom 类型中 capability 为 `scale | opacity | rotate | translate` 的原子。

| 原子        | 参数                        | 说明  |
| --------- | ------------------------- | --- |
| scale     | position?, value, trigger | 缩放  |
| opacity   | position?, value, trigger | 透明度 |
| rotate    | position?, value, trigger | 旋转  |
| translate | position?, x, y, trigger  | 位移  |

trigger: `'hover' | 'click' | 'drag'`

### 4. 用户输入原子 (InputAtom)

用户输入原子是 Atom 类型中 capability 为 `drag | resize | scroll | click` 的原子。

| 原子     | 参数                    | 说明   |
| ------ | --------------------- | ---- |
| drag   | position?             | 拖拽   |
| resize | position?, direction? | 调整大小 |
| scroll | position?             | 滚动   |
| click  | position?             | 点击   |

### 5. 布局原子 (LayoutAtom)

布局原子是 Atom 类型中 capability 为 `gap` 的原子。

| 原子  | 参数             | 说明 |
| --- | -------------- | -- |
| gap | position, size | 间距 |

### 6. 容器原子 (ContainerAtom)

容器原子是 Atom 类型中 capability 为 `container` 的原子。

| 原子        | 参数       | 说明 |
| --------- | -------- | -- |
| container | position | 容器 |

**说明**：

- `position?` 表示该原子可以设置位置（相对于分子容器）
- 不设置 `position` 的原子由 BeakerManager 自动排列

## Catalyst 职责

### 位置

独立文件 `Catalyst.tsx`

### 导出

```typescript
type ContentAtom = TextAtom | ImageAtom | VideoAtom | AudioAtom | CodeAtom | IconAtom;
type DecorationAtom = BackgroundAtom | BorderAtom | ShadowAtom;
type AnimationAtom = ScaleAtom | OpacityAtom | RotateAtom | TranslateAtom;
type InputAtom = DragAtom | ResizeAtom | ScrollAtom | ClickAtom;

export const Catalyst: {
  decompose: (atoms: Atom[], moleculePosition?: Position) => { renderable: ContentAtom[]; others: Atom[] };
}
```

### decompose(atoms, moleculePosition?)

将原子数组分为可渲染和其他两类，并将原子位置转换为绝对坐标。

**参数**：

```typescript
atoms: Atom[]                    // 原子数组
moleculePosition?: Position       // 分子在页面中的位置（可选）
```

**返回值**：

```typescript
{
  renderable: ContentAtom[];  // 内容原子（位置已转换为绝对坐标）
  others: Atom[];             // 其他所有原子
}
```

**绝对坐标计算**：

```typescript
const getAbsolutePosition = (atomPosition?: Position, moleculePosition?: Position): Position => {
  const baseX = moleculePosition?.x || 0;
  const baseY = moleculePosition?.y || 0;
  const baseZ = moleculePosition?.z;

  if (!atomPosition) {
    return { x: baseX, y: baseY, z: baseZ };
  }

  return {
    x: baseX + atomPosition.x,
    y: baseY + atomPosition.y,
    z: atomPosition.z,
  };
};
```

**内部逻辑**：

```typescript
const RENDERABLE_CAPABILITIES = ['text', 'image', 'video', 'audio', 'code', 'icon'];

decompose(atoms: Atom[], moleculePosition?: Position) {
  const renderable: ContentAtom[] = [];
  const others: Atom[] = [];

  atoms.forEach(atom => {
    if (RENDERABLE_CAPABILITIES.includes(atom.capability)) {
      const absoluteAtom = {
        ...atom,
        position: getAbsolutePosition(atom.position, moleculePosition),
      } as ContentAtom;
      renderable.push(absoluteAtom);
    } else {
      others.push(atom);
    }
  });

  return { renderable, others };
}
```

**坐标转换规则**：

| 分子位置 | 原子位置 | 原子绝对坐标 |
| ----- | ----- | --------- |
| `{ x: 100, y: 200 }` | `{ x: 10, y: 20 }` | `{ x: 110, y: 220 }` |
| `{ x: 100, y: 200 }` | `undefined` | `{ x: 100, y: 200 }` |
| `undefined` | `{ x: 10, y: 20 }` | `{ x: 10, y: 20 }` |
| `undefined` | `undefined` | `{ x: 0, y: 0 }` |

## BeakerManager 职责

### 位置

独立文件 `BeakerManager.tsx`

### 导出

```typescript
export const BeakerManager: React.FC<{ molecule: Molecule }>
```

### Props 接口

```typescript
interface BeakerManagerProps {
  molecule: Molecule;  // 分子数据
}
```

### 内部状态

```typescript
// 触发器状态 (hover / click)
const [triggers, setTriggers] = useState<Set<string>>(new Set());

// 拖拽状态
const [isDragging, setIsDragging] = useState(false);
const [draggingId, setDraggingId] = useState<string | null>(null);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
```

### 状态计算

```typescript
const isHovered = triggers.has(`${id}-hover`);
const isClicked = triggers.has(`${id}-click`);
const isCurrentlyDragging = isDragging && draggingId === id;
```

### 样式应用逻辑

#### 装饰原子处理

```typescript
decorationAtoms.forEach(atom => {
  if (atom.capability === 'background') {
    containerStyle.backgroundColor = `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`;
  }
  if (atom.capability === 'border') {
    containerStyle.border = `${atom.width}px solid rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`;
    if (atom.radius) {
      containerStyle.borderRadius = atom.radius;
    }
  }
  if (atom.capability === 'shadow') {
    containerStyle.boxShadow = `${atom.x}px ${atom.y}px ${atom.blur}px rgba(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]}, 0.25)`;
  }
});
```

#### 动画原子处理

```typescript
animationAtoms.forEach(atom => {
  // scale
  if (atom.capability === 'scale') {
    const shouldApply =
      (atom.trigger === 'hover' && isHovered) ||
      (atom.trigger === 'click' && isClicked) ||
      (atom.trigger === 'drag' && isCurrentlyDragging);
    if (shouldApply) {
      containerStyle.transform = `scale(${atom.value})`;
    }
  }

  // opacity
  if (atom.capability === 'opacity') {
    const shouldApply =
      (atom.trigger === 'hover' && isHovered) ||
      (atom.trigger === 'click' && isClicked) ||
      (atom.trigger === 'drag' && isCurrentlyDragging);
    if (shouldApply) {
      containerStyle.opacity = atom.value;
    }
  }

  // rotate
  if (atom.capability === 'rotate') {
    const shouldApply =
      (atom.trigger === 'hover' && isHovered) ||
      (atom.trigger === 'click' && isClicked);
    if (shouldApply) {
      containerStyle.transform = `rotate(${atom.value}deg)`;
    }
  }

  // translate (仅 drag 触发)
  if (atom.capability === 'translate') {
    if (isCurrentlyDragging) {
      containerStyle.transform = `translate(${atom.x}px, ${atom.y}px)`;
    }
  }
});
```

### 事件处理

#### hover 事件

```typescript
const handleMouseEnter = () => {
  if (hasHoverTrigger) {
    trigger(`${id}-hover`);
  }
};

const handleMouseLeave = () => {
  if (hasHoverTrigger) {
    untrigger(`${id}-hover`);
  }
};
```

#### click 事件

```typescript
const handleClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (hasClick) {
    trigger(`${id}-click`);
    setTimeout(() => untrigger(`${id}-click`), 200);
  }
};
```

#### drag 事件

```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  if (hasDrag) {
    e.preventDefault();
    startDrag(id);
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateDragOffset({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      endDrag();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
};
```

### 渲染输出

```tsx
return (
  <div
    style={containerStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    onMouseDown={handleMouseDown}
    onClick={handleClick}
  >
    {renderable.map((atom, index) => (
      <AtomRenderer key={index} atom={atom} />
    ))}
  </div>
);
```

## AtomRenderer 职责

### 位置

文件 `AtomRenderer.tsx`

### 导出

```typescript
export const AtomRenderer: React.FC<{ atom: Atom }>
```

### 渲染器列表

| capability | 渲染器组件         |
| ---------- | ------------- |
| text       | TextRenderer  |
| image      | ImageRenderer |
| video      | VideoRenderer |
| audio      | AudioRenderer |
| code       | CodeRenderer  |
| icon       | IconRenderer  |

### 渲染器实现

#### TextRenderer

```tsx
const TextRenderer: React.FC<TextAtom> = (atom) => (
  <div style={{
    position: 'absolute',
    left: atom.position?.x,
    top: atom.position?.y,
    zIndex: atom.position?.z,
    fontSize: atom.size,
    color: `rgb(${atom.color[0]}, ${atom.color[1]}, ${atom.color[2]})`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    lineHeight: 1.4,
  }}>
    {atom.text}
  </div>
);
```

#### ImageRenderer

```tsx
const ImageRenderer: React.FC<ImageAtom> = (atom) => (
  <img
    src={atom.src}
    alt={atom.alt || ''}
    style={{
      position: 'absolute',
      left: atom.position?.x,
      top: atom.position?.y,
      zIndex: atom.position?.z,
      width: atom.width,
      height: atom.height,
      objectFit: 'cover',
    }}
  />
);
```

#### VideoRenderer

```tsx
const VideoRenderer: React.FC<VideoAtom> = (atom) => (
  <video
    src={atom.src}
    controls
    style={{
      position: 'absolute',
      left: atom.position?.x,
      top: atom.position?.y,
      zIndex: atom.position?.z,
      width: atom.width || '100%',
      height: atom.height,
    }}
  />
);
```

#### AudioRenderer

```tsx
const AudioRenderer: React.FC<AudioAtom> = (atom) => (
  <audio
    src={atom.src}
    controls
    style={{
      position: 'absolute',
      left: atom.position?.x,
      top: atom.position?.y,
      zIndex: atom.position?.z,
    }}
  />
);
```

#### CodeRenderer

```tsx
const CodeRenderer: React.FC<CodeAtom> = (atom) => (
  <pre style={{
    position: 'absolute',
    left: atom.position?.x,
    top: atom.position?.y,
    zIndex: atom.position?.z,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    overflow: 'auto',
    fontSize: 14,
    fontFamily: 'monospace',
  }}>
    <code>{atom.code}</code>
  </pre>
);
```

#### IconRenderer

```tsx
const IconRenderer: React.FC<IconAtom> = (atom) => (
  <span style={{
    position: 'absolute',
    left: atom.position?.x,
    top: atom.position?.y,
    zIndex: atom.position?.z,
    fontSize: atom.size || 24,
  }}>
    {atom.icon}
  </span>
);
```

**注意**：所有原子渲染器都使用 `position: absolute` 定位，根据 `atom.position` 设置 `left`、`top`、`zIndex`。

## 分子组合示例

### 拖拽移动

```
atoms: [
  { capability: 'text', position: { x: 10, y: 10 }, text: '可拖拽', size: 16, color: [0, 0, 0] },
  { capability: 'background', position: { x: 0, y: 0 }, color: [255, 255, 255] },
  { capability: 'drag', position: { x: 0, y: 0 } },
]
```

**效果**：用户可拖动整个容器

### 悬停缩放

```
atoms: [
  { capability: 'image', position: { x: 0, y: 0 }, src: '/cat.jpg', width: 200, height: 200 },
  { capability: 'scale', value: 1.05, trigger: 'hover' },
]
```

**效果**：鼠标悬停时图片放大 5%

### 悬停淡出

```
atoms: [
  { capability: 'text', position: { x: 0, y: 0 }, text: '悬停消失', size: 18, color: [0, 0, 0] },
  { capability: 'opacity', value: 0.2, trigger: 'hover' },
]
```

**效果**：鼠标悬停时文字变透明

### 点击脉冲

```
atoms: [
  { capability: 'text', position: { x: 10, y: 10 }, text: '点击我', size: 20, color: [255, 255, 255] },
  { capability: 'background', position: { x: 0, y: 0 }, color: [66, 133, 244] },
  { capability: 'scale', value: 0.95, trigger: 'click' },
  { capability: 'click', position: { x: 0, y: 0 } },
]
```

**效果**：点击时容器缩小，200ms 后恢复

### 层叠卡片

```
atoms: [
  { capability: 'background', position: { x: 0, y: 0 }, color: [255, 255, 255] },
  { capability: 'shadow', position: { x: 0, y: 0 }, x: 0, y: 4, blur: 12, color: [0, 0, 0] },
  { capability: 'border', position: { x: 0, y: 0 }, width: 1, color: [229, 229, 229], radius: 12 },
  { capability: 'text', position: { x: 16, y: 16 }, text: '蓝色卡片', size: 18, color: [0, 0, 0] },
]
```

**效果**：白色卡片带阴影和圆角边框

### 悬停旋转卡片

```
atoms: [
  { capability: 'background', position: { x: 0, y: 0 }, color: [255, 182, 193] },
  { capability: 'text', position: { x: 10, y: 10 }, text: '旋转', size: 24, color: [255, 255, 255] },
  { capability: 'rotate', value: 15, trigger: 'hover' },
]
```

**效果**：悬停时卡片旋转 15 度

## 文件结构

```
packages/atom-engine/
├── src/
│   ├── AtomRenderer.tsx    # 原子渲染器（类型定义 + 渲染器）
│   ├── Catalyst.tsx        # 催化剂（拆解分子）
│   ├── BeakerManager.tsx   # 状态管理员（调控引擎）
│   ├── types/
│   │   └── index.ts        # Position 类型
│   └── index.ts            # 导出
├── ARCHITECTURE.md
└── package.json
```

## index.ts 导出

```typescript
export { AtomEngine, BeakerManager } from './BeakerManager';
export { Catalyst } from './Catalyst';
export { AtomRenderer } from './AtomRenderer';
export type { Molecule, Atom, ContentAtom, DecorationAtom, AnimationAtom, InputAtom } from './AtomRenderer';
export type { Position } from './types';
```

## 设计原则

1. **单一能力**：一个原子只能拥有一种能力
2. **无通用字段**：不需要 id, content, style, config 等通用字段
3. **固定结构**：每个原子只有 `capability` 类型字段 + 该能力专属参数
4. **原子分类**：
   - 内容原子：渲染视觉内容
   - 装饰原子：容器样式
   - 动画原子：视觉效果
   - 输入原子：用户交互
5. **状态自管理**：BeakerManager 根据分子内容自动管理所需状态
6. **单向数据流**：Demo → BeakerManager → Catalyst → AtomRenderer
7. **原子不自知**：原子不知道自己被谁使用，由上层组件决定如何处理
8. **坐标转换**：Catalyst.decompose 在拆解分子时计算原子绝对坐标（原子相对位置 + 分子绝对位置）

## 使用流程

### 1. 定义分子

```typescript
const card: Molecule = {
  id: 'my-card',
  position: { x: 100, y: 200 },  // 分子在页面中的绝对位置
  atoms: [
    { capability: 'background', position: { x: 0, y: 0 }, color: [255, 255, 255] },
    { capability: 'shadow', position: { x: 0, y: 0 }, x: 0, y: 2, blur: 8, color: [0, 0, 0] },
    { capability: 'border', position: { x: 0, y: 0 }, width: 1, color: [229, 229, 229], radius: 12 },
    { capability: 'text', position: { x: 16, y: 16 }, text: 'Hello', size: 20, color: [0, 0, 0] },
  ],
};
```

### 2. 使用 BeakerManager

```tsx
import { BeakerManager } from 'atom-engine';

function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <BeakerManager molecule={card} />
    </div>
  );
}
```

### 3. BeakerManager 自动处理

- 调用 Catalyst.decompose(molecule.atoms) 分类原子
- 分类原子为 renderable 和 others
- 识别需要的状态管理
- 绑定事件监听
- 应用样式到容器
- 调用 AtomRenderer 渲染内容原子

