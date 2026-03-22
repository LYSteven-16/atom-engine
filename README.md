# @component-chemistry/atom-renderer

基于化学隐喻的 React 组件渲染框架，采用原子设计原则。

## 核心概念

### 三层架构

```
┌─────────────────────────────────────────────────────┐
│                    化合物层 (Compound)                │
│              完整的功能系统（如答题卡）                  │
├─────────────────────────────────────────────────────┤
│                    分子层 (Molecule)                  │
│              功能组合（如选择题组件）                   │
├─────────────────────────────────────────────────────┤
│                    原子层 (Atom)                      │
│              最小功能单元（如文本、图片）                │
└─────────────────────────────────────────────────────┘
```

### 7 大原子能力类别

| 类别 | 能力 | 数量 |
|------|------|------|
| Content (内容) | text, image, video, audio, code, table, icon | 7 |
| Decoration (装饰) | background, border, shadow, shape, underline, highlight | 6 |
| Structure (结构) | collapsible, switchable, expandable | 3 |
| Animation (动画) | scale, rotation, collapse, expand, fade, hoverTransition, clickTransition | 7 |
| Interaction (交互) | clickable, draggable, typeable, drawable | 4 |
| Layout (布局) | resizable, gap | 2 |
| Container (容器) | container, slot, layer | 3 |

**总计: 30+ 原子能力**

## 架构优点

### 1. 职责分离清晰
- **AtomRenderer**: 纯调度器，只负责将能力分发给对应渲染器
- **渲染器**: 每个能力有独立的渲染器文件，易于维护
- **可扩展**: 新增能力只需添加新的 capability 文件

### 2. 类型安全
- 所有能力都有 TypeScript 类型定义
- 编译时检查组件配置是否正确
- 完整的类型推导支持

### 3. 灵活性高
- 支持自定义渲染器注入
- 可选的 fallback 处理机制
- 模式切换（编辑/预览）

### 4. 化学隐喻设计
- 原子 → 最小功能单元
- 分子 → 功能组合
- 化合物 → 完整系统
- 命名直观，便于团队沟通

## 目录结构

```
src/
├── index.ts                 # 主入口
├── types/
│   └── index.ts           # 类型定义 (AtomType, EditorComponent, etc.)
├── renderers/
│   └── index.tsx           # 核心渲染器 (AtomRenderer, ChemistryLab)
└── capabilities/
    ├── ContentCapability.tsx    # 内容能力
    ├── DecorationCapability.tsx # 装饰能力
    ├── StructureCapability.tsx  # 结构能力
    ├── AnimationCapability.tsx  # 动画能力
    ├── InteractionCapability.tsx # 交互能力
    ├── LayoutCapability.tsx     # 布局能力
    └── ContainerCapability.tsx  # 容器能力
```

## 快速开始

### 基本用法

```tsx
import { AtomRenderer } from '@component-chemistry/atom-renderer';
import { contentRenderers } from '@component-chemistry/atom-renderer/capabilities';
import { decorationRenderers } from '@component-chemistry/atom-renderer/capabilities';

const component = {
  id: '1',
  type: 'text-block',
  capabilities: ['text', 'background'],
  content: {
    text: 'Hello World'
  },
  style: {
    fontSize: 16,
    backgroundColor: '#f0f0f0'
  }
};

// 合并所有内置渲染器
const allRenderers = {
  ...contentRenderers,
  ...decorationRenderers,
};

function App() {
  return (
    <AtomRenderer 
      component={component} 
      mode="edit"
      renderers={allRenderers}
    />
  );
}
```

### 使用 ChemistryLab (完整容器)

```tsx
import { ChemistryLab } from '@component-chemistry/atom-renderer';
import { contentRenderers } from '@component-chemistry/atom-renderer/capabilities';

function App() {
  return (
    <ChemistryLab
      component={component}
      mode="edit"
      renderers={contentRenderers}
      style={{
        position: 'absolute',
        left: 100,
        top: 200,
        width: 300,
        height: 200,
      }}
    />
  );
}
```

### 自定义渲染器

```tsx
import { AtomRenderer } from '@component-chemistry/atom-renderer';
import { contentRenderers } from '@component-chemistry/atom-renderer/capabilities';

// 添加自定义渲染器
const customRenderer = ({ component }) => (
  <div style={{ color: 'red' }}>
    Custom: {component.content?.text}
  </div>
);

const allRenderers = {
  ...contentRenderers,
  'my-custom-capability': customRenderer,
};

// 处理未找到的渲染器
function fallbackRenderer(capability: string, component) {
  return <div>Unknown: {capability}</div>;
}

<AtomRenderer
  component={component}
  renderers={allRenderers}
  onCapabilityNotFound={fallbackRenderer}
/>
```

## 核心类型

### EditorComponent

```typescript
interface EditorComponent {
  id: string;
  type: string;
  capabilities?: AtomType[];  // 原子能力列表
  content?: CompoundContent;  // 内容数据
  style?: CompoundStyle;      // 样式配置
  children?: EditorComponent[]; // 子组件
  [key: string]: unknown;      // 扩展字段
}
```

### AtomType

```typescript
type AtomType =
  | ContentCapability      // 'text' | 'image' | 'video' | 'audio' | 'code' | 'table' | 'icon'
  | DecorationCapability   // 'background' | 'border' | 'shadow' | ...
  | StructureCapability     // 'collapsible' | 'switchable' | 'expandable'
  | AnimationCapability    // 'scale' | 'rotation' | 'collapse' | ...
  | InteractionCapability   // 'clickable' | 'draggable' | 'typeable' | 'drawable'
  | LayoutCapability       // 'resizable' | 'gap'
  | ContainerCapability;    // 'container' | 'slot' | 'layer'
```

### CompoundStyle

```typescript
type CompoundStyle = {
  x?: number;
  y?: number;
  width?: number | string;
  height?: number;
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  backgroundColor?: string;
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  zIndex?: number;
  border?: string;
  boxShadow?: string;
  display?: string;
  flexDirection?: string;
  gap?: number;
  alignItems?: string;
  justifyContent?: string;
  overflow?: string;
};
```

## 扩展指南

### 添加新的原子能力

1. 在 `types/index.ts` 中添加新的 capability 类型:

```typescript
export type MyCapability = 'myFeatureA' | 'myFeatureB';
```

2. 更新 AtomType 联合类型:

```typescript
export type AtomType =
  | ContentCapability
  | // ... 其他
  | MyCapability;
```

3. 创建新的 capability 文件 `MyCapability.tsx`:

```typescript
import React from 'react';
import type { EditorComponent, MyCapability } from '../types';

interface RendererProps {
  component: EditorComponent;
}

export const MyFeatureARenderer: React.FC<RendererProps> = ({ component }) => {
  return <div>My Feature A</div>;
};

export const myRenderers: Record<MyCapability, React.FC<RendererProps>> = {
  myFeatureA: MyFeatureARenderer,
  myFeatureB: MyFeatureARenderer, // 或不同的渲染器
};
```

4. 在使用时合并渲染器:

```typescript
const allRenderers = {
  ...contentRenderers,
  ...myRenderers,
};
```

## 设计原则

1. **渲染器只处理原子**: 每个渲染器只负责一种原子能力
2. **交互效果拆解为原子**: 可选中、可排序等是分子级组合
3. **每类能力单独文件**: 易于维护和扩展
4. **化学隐喻命名**: 原子、分子、化合物，直观易懂

## License

MIT
