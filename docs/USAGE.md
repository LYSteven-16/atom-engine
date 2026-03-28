# 使用 AtomEngine

## 安装

```bash
npm install @component-chemistry/atom-engine
```

或

```bash
yarn add @component-chemistry/atom-engine
```

## 基本用法

### 1. HTML 页面中直接使用

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AtomEngine Demo</title>
</head>
<body>
  <div id="app"></div>
  
  <script type="module">
    import { SubstanceManager } from '@component-chemistry/atom-engine';
    
    const molecules = [
      {
        id: 'my-card',
        position: { x: 100, y: 100 },
        width: 400,
        height: 300,
        atoms: [
          {
            id: 'bg',
            capability: 'background',
            color: [255, 255, 255]
          },
          {
            id: 'border',
            capability: 'border',
            borderWidth: 1,
            color: [220, 220, 220],
            radius: 12
          },
          {
            id: 'text',
            capability: 'text',
            position: { x: 20, y: 30 },
            text: 'Hello AtomEngine!',
            size: 22,
            color: [50, 100, 200]
          }
        ]
      }
    ];
    
    // 创建引擎实例
    const manager = new SubstanceManager(molecules);
    
    // 获取 Baker（容器）
    const baker = manager.getBakerManager().getBaker('baker-0');
    
    // 添加到页面
    document.getElementById('app').appendChild(baker.element);
  </script>
</body>
</html>
```

### 2. 在 React/Vue 等框架中使用

```javascript
// React 示例
import { SubstanceManager } from '@component-chemistry/atom-engine';
import { useEffect, useRef } from 'react';

function AtomComponent({ molecules }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 创建引擎实例
    const manager = new SubstanceManager(molecules);
    
    // 获取所有 Baker
    const bakers = manager.getBakerManager().getAllBakers();
    
    // 将 Baker 添加到容器中
    bakers.forEach(baker => {
      containerRef.current.appendChild(baker.element);
    });
    
    // 清理
    return () => {
      bakers.forEach(baker => {
        baker.element.remove();
      });
    };
  }, [molecules]);
  
  return <div ref={containerRef}></div>;
}
```

### 3. Node.js 环境（服务端渲染）

```javascript
const { SubstanceManager } = require('@component-chemistry/atom-engine');

// 创建分子配置
const molecules = [
  {
    id: 'card',
    position: { x: 0, y: 0 },
    width: 400,
    height: 300,
    atoms: [
      {
        id: 'bg',
        capability: 'background',
        color: [255, 255, 255]
      }
    ]
  }
];

// 创建引擎实例
const manager = new SubstanceManager(molecules);

// 获取 Baker
const baker = manager.getBakerManager().getBaker('baker-0');

// 可以在服务器端生成 HTML
const html = `<div>${baker.element.outerHTML}</div>`;
```

## 完整示例

```javascript
import { SubstanceManager } from '@component-chemistry/atom-engine';

// 定义分子配置
const molecules = [
  {
    id: 'main-container',
    position: { x: 50, y: 50 },
    width: 600,
    height: 400,
    atoms: [
      // 背景
      {
        id: 'bg-main',
        capability: 'background',
        color: [245, 245, 245]
      },
      
      // 边框
      {
        id: 'border-main',
        capability: 'border',
        borderWidth: 1,
        color: [200, 200, 200],
        radius: 12
      },
      
      // 标题
      {
        id: 'title',
        capability: 'text',
        position: { x: 30, y: 30 },
        text: '我的应用',
        size: 28,
        color: [50, 100, 200]
      },
      
      // 描述
      {
        id: 'description',
        capability: 'text',
        position: { x: 30, y: 70 },
        text: '这是一个使用 AtomEngine 构建的应用',
        size: 16,
        color: [100, 100, 100]
      },
      
      // 子分子
      {
        id: 'sub-molecule',
        position: { x: 30, y: 120 },
        width: 540,
        height: 200,
        atoms: [
          {
            id: 'bg-sub',
            capability: 'background',
            color: [255, 255, 255]
          },
          {
            id: 'text-sub',
            capability: 'text',
            position: { x: 20, y: 20 },
            text: '这是子分子',
            size: 18,
            color: [80, 80, 80]
          }
        ]
      },
      
      // 调整把手
      {
        id: 'resize-handle',
        capability: 'resize-handle',
        targetAtomIds: ['bg-main', 'border-main'],
        fixedAtomIds: ['title', 'description'],
        minWidth: 400,
        minHeight: 300
      }
    ]
  }
];

// 初始化
const manager = new SubstanceManager(molecules);

// 获取所有 Baker 并添加到 DOM
const bakers = manager.getBakerManager().getAllBakers();
document.body.append(...bakers.map(b => b.element));
```

## API 参考

### SubstanceManager

```typescript
class SubstanceManager {
  constructor(molecules: Molecule[]);
  getBakerManager(): BeakerManager;
}
```

### BeakerManager

```typescript
class BeakerManager {
  getBaker(id: string): Beaker | undefined;
  getAllBakers(): Beaker[];
  getBakerState(id: string): BakerState | undefined;
  getAllBakerStates(): BakerState[];
  getBakerCount(): number;
}
```

### Beaker

```typescript
class Beaker {
  readonly id: string;
  readonly molecule: Molecule;
  readonly element: HTMLElement;
  
  getState(): BakerState;
  updateState(newState: Partial<BakerState>): void;
}
```

## 常见问题

### Q: 如何在 TypeScript 中使用？

A: 包已包含完整的 TypeScript 类型定义，直接使用即可：

```typescript
import { SubstanceManager, type Molecule } from '@component-chemistry/atom-engine';

const molecule: Molecule = {
  id: 'my-molecule',
  atoms: []
};
```

### Q: 能否在 Vue 组件中使用？

A: 可以，但需要注意生命周期管理：

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { SubstanceManager } from '@component-chemistry/atom-engine';

const container = ref(null);
let bakers = [];

onMounted(() => {
  const manager = new SubstanceManager(molecules);
  bakers = manager.getBakerManager().getAllBakers();
  container.value.append(...bakers.map(b => b.element));
});

onUnmounted(() => {
  bakers.forEach(baker => {
    baker.element.remove();
  });
});
</script>
```

### Q: 如何动态添加新的分子？

A: 创建新的 SubstanceManager 实例：

```javascript
// 获取现有分子
const existingMolecules = [...currentMolecules, newMolecule];

// 重新创建引擎
const manager = new SubstanceManager(existingMolecules);
```

### Q: 是否支持 SSR？

A: 目前主要设计用于浏览器环境，Node.js 环境需要手动处理 DOM 相关操作。
