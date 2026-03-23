# 原子尺寸行为规范

## 概述

原子的大部分属性都是**可选的**，使用 `?` 标记。未设置的属性会使用默认值或自动计算。

`background`、`border`、`shadow` 这三个装饰原子的尺寸和位置是**独立可选的**，可以单独设置其中一个，也可以同时设置。

## 通用默认值

| 属性 | 默认值 |
|------|--------|
| `position` | `{ x: 0, y: 0 }` |
| `width`/`height` 等尺寸 | 父容器的 100% |
| `radius` | `0`（无圆角） |
| `duration` | `0`（无动画过渡） |
| `z` | `0` |

## 尺寸与位置逻辑

### 尺寸字段

| 原子类型 | 尺寸字段 | 默认值 |
|---------|---------|--------|
| background | `width`, `height` | 100%（填满父容器） |
| border | `borderWidth`, `borderHeight` | 100%（填满父容器） |
| shadow | `shadowWidth`, `shadowHeight` | 100%（填满父容器） |

### 位置字段

| 原子类型 | 位置字段 |
|---------|---------|
| background | `position.x`, `position.y`, `position.z` |
| border | `position.x`, `position.y`, `position.z` |
| shadow | `position.x`, `position.y`, `position.z` |

### 独立规则

- **尺寸**：设置了 `width`/`height`（或对应字段）就使用该值，否则默认 100%
- **位置**：设置了 `position.x` 或 `position.y` 就使用该值，否则默认 `0, 0`
- 尺寸和位置**互不影响**，可以只设置其中一个

## 示例

### 填满父容器（默认）
```typescript
{ capability: 'background', color: [255, 200, 200] }
```

### 只设置尺寸（position 默认为 0, 0）
```typescript
{
  capability: 'background',
  color: [255, 200, 200],
  width: 200,
  height: 100
}
```

### 只设置位置（尺寸默认为 100%）
```typescript
{
  capability: 'background',
  color: [255, 200, 200],
  position: { x: 10, y: 20 }
}
```

### 同时设置尺寸和位置
```typescript
{
  capability: 'background',
  color: [255, 200, 200],
  width: 200,
  height: 100,
  position: { x: 10, y: 20, z: 1 }
}
```

### border 原子
```typescript
{
  capability: 'border',
  width: 2,
  color: [100, 100, 100],
  borderWidth: 300,
  borderHeight: 150,
  position: { x: 0, y: 0 },
  radius: 8
}
```

### shadow 原子
```typescript
{
  capability: 'shadow',
  x: 3,
  y: 3,
  blur: 10,
  color: [0, 0, 0],
  shadowWidth: 200,
  shadowHeight: 100,
  position: { x: 5, y: 5 },
  radius: 4
}
```
