# 原子尺寸行为规范

## 概述

`background`、`border`、`shadow` 这三个原子能力的尺寸是**可选关键字**。

## 尺寸规则

### 1. 如果传入了 width/height（或对应字段）

- 必须同时传入 `position`（包含 x, y, z）
- 使用传入的具体像素值

### 2. 如果什么都没传

- 默认填满父容器（100% width, 100% height）
- `position` 也可选

## 各原子字段对照

| 原子类型 | 尺寸字段 | 示例 |
|---------|---------|------|
| background | `width`, `height` | `{ width: 200, height: 100 }` |
| border | `borderWidth`, `borderHeight` | `{ borderWidth: 200, borderHeight: 100 }` |
| shadow | `shadowWidth`, `shadowHeight` | `{ shadowWidth: 200, shadowHeight: 100 }` |

## 示例

### 填满父容器（默认）
```typescript
{ capability: 'background', color: [255, 200, 200] }
```

### 指定尺寸和位置
```typescript
{ 
  capability: 'background', 
  color: [255, 200, 200],
  width: 200,
  height: 100,
  position: { x: 10, y: 20 }
}
```

### 只有尺寸（默认 position 为 0,0）
```typescript
{ 
  capability: 'border',
  width: 2,
  color: [100, 100, 100],
  borderWidth: 300,
  borderHeight: 150
}
```
