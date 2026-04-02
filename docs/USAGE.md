# 使用 AtomEngine

## 安装

```bash
npm install @LYSteven-16/atom-engine
```

## 基本用法

### 1. ES Module 导入

```javascript
import { BeakerManager } from '@LYSteven-16/atom-engine';

const manager = new BeakerManager();

const molecule = {
  id: 'my-component',
  position: { x: 100, y: 100 },
  width: 200,
  height: 100,
  atoms: [
    {
      capability: 'background',
      id: 'bg-1',
      color: [255, 0, 0],
      opacity: 0.5
    }
  ]
};

manager.createBeaker('app', molecule);
```

### 2. 在 HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
  <title>AtomEngine Demo</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { BeakerManager } from 'atom-engine';
    
    const manager = new BeakerManager();
    
    const molecule = {
      id: 'my-component',
      position: { x: 100, y: 100 },
      width: 200,
      height: 100,
      atoms: [
        {
          capability: 'background',
          id: 'bg-1',
          color: [255, 0, 0],
          opacity: 0.5
        }
      ]
    };
    
    manager.createBeaker('app', molecule);
  </script>
</body>
</html>
```

## 核心概念

### 分子 (Molecule)

分子是组件的基本单位，包含位置、尺寸和子元素：

```javascript
{
  id: 'unique-id',
  position: { x: 0, y: 0 },
  width: 100,
  height: 100,
  atoms: [
    // 原子列表
  ]
}
```

### 原子 (Atom)

原子是功能单元，不同的 capability 对应不同的功能：

| Capability | 功能 |
|------------|------|
| background | 背景色/渐变 |
| border | 边框 |
| shadow | 阴影 |
| text | 文本显示 |
| click | 点击事件 |
| drag | 拖拽事件 |
| hover | 悬停事件 |
| scale | 缩放动画 |
| opacity | 透明度动画 |
| input | 文本输入 |
| select | 下拉选择 |
| flex | Flexbox 布局 |

更多原子请查看 `src/atoms/` 目录。
