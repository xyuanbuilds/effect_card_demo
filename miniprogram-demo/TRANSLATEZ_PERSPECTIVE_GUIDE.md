# translateZ 透视缩放效果指南

## 概述

通过调整 `translateZ` 的值而不改变 `scale`，利用透视投影产生自然的缩放视觉效果。

## 基本原理

在有透视的 3D 环境中，物体沿 Z 轴移动会产生缩放的视觉效果：

- **Z > 0**：物体向观众靠近 → 显得更大
- **Z < 0**：物体远离观众 → 显得更小
- **Z = 0**：物体在透视平面上 → 正常大小

## 计算公式

当你想要物体显得缩放到 `targetScale` 大小时：

```javascript
// 期望的缩放大小
const targetScale = 1 - absProgress * 0.1;

// 根据透视距离和缩放大小反推 Z 轴位移
const perspectiveDistance = 1200; // CSS 中的 perspective 值（rpx）
const translateZ = -perspectiveDistance * (1 - targetScale);
```

## 效果对应关系

### 示例 1：使用默认透视距离 (1200px)

| absProgress | targetScale | translateZ | 视觉效果                    |
| ----------- | ----------- | ---------- | --------------------------- |
| 0           | 1.0 (100%)  | 0 rpx      | 卡片在前，完整尺寸          |
| 1           | 0.9 (90%)   | -50 rpx    | 卡片后退，显得 90% 大小     |
| 2           | 0.8 (80%)   | -100 rpx   | 卡片更后退，显得 80% 大小   |
| 3           | 0.7 (70%)   | -150 rpx   | 卡片大幅后退，显得 70% 大小 |

### 示例 2：调整透视距离影响

```css
/* 透视距离越小，同样 Z 轴变化产生的缩放效果越强 */

.cards-wrapper {
  perspective: 800px; /* 较近的透视 → 效果更强 */
}

.cards-wrapper {
  perspective: 1200px; /* 默认透视 */
}

.cards-wrapper {
  perspective: 2000px; /* 较远的透视 → 效果更弱 */
}
```

## 实现细节

### 当前代码中的计算

```javascript
// 原来的缩放方式
const scale = progress === 0 ? 1 : (1 - absProgress * 0.1);

// 新的透视方式
const perspectiveScale = 1 - absProgress * 0.1;  // 期望的缩放大小
const translateZ = -500 * (1 - perspectiveScale);  // 转换为 Z 轴深度

// 最终 transform
transform: translate3d(${translateX}rpx, 0, ${translateZ}rpx) rotateZ(${rotate}deg) scale(1)
```

**关键改变**：

1. `scale` 始终保持为 `1`
2. 所有缩放效果通过 `translateZ` 和透视实现
3. 透视距离由 CSS 中的 `perspective` 属性控制

## 优点

✅ **更自然的深度感** - 使用透视而不是缩放，产生更真实的 3D 效果
✅ **避免文本模糊** - `scale` 缩放有时会导致文本渲染不清晰，Z 轴移动不会
✅ **更灵活的调整** - 只需改变 `perspective` 值即可调整整体效果强度
✅ **性能更优** - `translateZ` 往往比 `scale` 有更好的硬件加速支持

## 调整方法

### 方法 1：改变透视距离（全局效果）

编辑 CSS 中的 `perspective` 值：

```css
.cards-wrapper {
  perspective: 1000px; /* 增强效果 */
  /* 或 */
  perspective: 1500px; /* 减弱效果 */
}
```

### 方法 2：改变 Z 轴衰减系数（局部精细调整）

编辑 JavaScript 中的公式：

```javascript
// 现在的公式：Z = -500 * (1 - perspectiveScale)
// 调整 500 的值来改变 Z 轴移动的范围

// 增强效果（更多 Z 轴移动）
const translateZ = -800 * (1 - perspectiveScale);

// 减弱效果（更少 Z 轴移动）
const translateZ = -300 * (1 - perspectiveScale);
```

### 方法 3：改变缩放系数

```javascript
// 现在：每层卡片缩小 10%
const perspectiveScale = 1 - absProgress * 0.1;

// 改为缩小 5%（效果更细微）
const perspectiveScale = 1 - absProgress * 0.05;

// 改为缩小 15%（效果更明显）
const perspectiveScale = 1 - absProgress * 0.15;
```

## 兼容性注意

### 小程序支持

✅ 小程序支持 3D transforms（`translate3d`、`perspective`）
✅ 小程序支持 `transform-style: preserve-3d`
✅ 所有现代小程序引擎都支持这些特性

### 浏览器支持

✅ 所有现代浏览器（Chrome、Firefox、Safari、Edge）
✅ IE 10+ 基本支持（可能有细节差异）

## 对比：scale vs translateZ

| 特性       | scale        | translateZ         |
| ---------- | ------------ | ------------------ |
| 视觉效果   | 简单缩放     | 透视缩放（更逼真） |
| 文本清晰度 | 可能模糊     | 保持清晰           |
| 性能       | 较好         | 更好（硬件加速）   |
| 实现复杂度 | 简单         | 中等               |
| 3D 感      | 平面感       | 立体感             |
| 调整灵活性 | 依赖代码改动 | 可通过 CSS 调整    |

## 测试建议

1. 在 effect-cards-test.js 页面测试不同的 `perSlideRotate` 和 `perSlideOffset` 值
2. 调整 CSS 中的 `perspective` 值观察效果变化
3. 修改 JavaScript 中的公式系数进行微调
4. 在不同设备（手机、平板）上验证效果一致性

## 常见问题

### Q：为什么卡片看起来还是缩放的？

A：这正是透视的效果！通过 `perspective` 和 `translateZ` 组合产生的缩放感是真实的 3D 投影，不是简单的尺寸缩放。

### Q：如何关闭透视效果？

A：设置 `perspective: none` 或删除 `perspective` 属性，但这会失去 3D 效果。

### Q：透视距离的最佳值是多少？

A：通常 800px - 1500px 之间效果较好。1200px 是较为平衡的选择。

### Q：能否同时使用 scale 和 translateZ？

A：可以，但会产生复合效果。建议要么只用 `scale`，要么只用 `translateZ`。
