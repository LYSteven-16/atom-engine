# AtomEngine

AtomEngine 是一个基于层级分解（原子/分子/物质）的纯 JavaScript 组件渲染引擎。它采用数据驱动架构，通过声明式配置生成复杂的交互式用户界面。

## 🚀 快速开始

### 安装

由于包托管在 GitHub Packages，安装前需要配置 registry：

#### 1. 创建 `.npmrc` 文件

在项目根目录创建 `.npmrc` 文件：

```ini
@LYSteven-16:registry=https://npm.pkg.github.com/
```

#### 2. 认证

需要 GitHub Personal Access Token（需要 `packages:read` 权限）。

**方式 A：临时登录**
```bash
npm login @LYSteven-16 --registry=https://npm.pkg.github.com/
```

**方式 B：永久配置**
在 `~/.npmrc` 或项目 `.npmrc` 中添加：
```ini
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

#### 3. 安装

```bash
npm install @LYSteven-16/atom-engine
```

### 基本使用

```html
<!DOCTYPE html>
<html>
<head>
  <title>AtomEngine Demo</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
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
  </script>
</body>
</html>
```

## 核心特性

- **零框架依赖**：仅依赖原生 JavaScript，可运行于任何现代浏览器
- **数据驱动渲染**：通过 JSON 配置声明界面，引擎自动处理 DOM 创建和交互
- **原子化设计**：组件由原子（Atom）组成，支持高度复用和组合
- **完整交互支持**：内置点击、拖拽、悬停、调整大小、滚动等交互原子
- **动画系统**：支持缩放、透明度、旋转、平移等 CSS 动画
- **样式装饰**：支持背景、边框、阴影等视觉装饰
- **表单输入**：支持文本输入、多行输入、下拉选择、复选框等
- **布局系统**：支持 Flexbox 布局、滚动容器
- **动态管理**：支持运行时添加、删除、更新分子
- **生命周期管理**：支持 onMount、onDestroy 回调，以及 destroy() 清理
- **子分子支持**：分子内可以包含子分子，支持无限嵌套

## 项目结构

```
atom-engine/
├── src/
│   ├── BeakerManager.ts         # 焙烤管理器（入口类）
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
│       ├── IconAtom.ts          # 图标原子（支持 SVG、emoji）
│       ├── CanvasAtom.ts        # 画布原子
│       ├── BackgroundAtom.ts    # 背景装饰原子（支持渐变）
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
│       ├── CollapseAtom.ts      # 折叠动画原子
│       ├── InputAtom.ts         # 单行文本输入原子
│       ├── TextareaAtom.ts      # 多行文本输入原子
│       ├── SelectAtom.ts        # 下拉选择原子
│       ├── CheckboxAtom.ts      # 复选框原子
│       ├── EditableTextAtom.ts  # 可编辑文本原子
│       ├── ScrollContainerAtom.ts # 滚动容器原子
│       └── FlexAtom.ts          # Flexbox 布局原子
├── demo/
│   └── index.html               # 示例页面
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 配置
└── ARCHITECTURE.md              # 架构文档
