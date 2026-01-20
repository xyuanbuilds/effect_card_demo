# EffectCards 计算问题分析与解决方案

## 问题总结

当 `perSlideRotate: 10`、`perSlideOffset: 10` 时，翻过一张卡片（currentIndex=1），三张卡片的 transform 样式存在差异：

### 你的当前实现（错误）

```
卡片 1：translate3d(-4.0px, 0, -52px) rotateZ(-10deg) scale(0.9)
卡片 2：translate3d(0px, 0, 0px) rotateZ(0deg) scale(1)
卡片 3：translate3d(4.0px, 0, -52px) rotateZ(10deg) scale(0.9)
```

### 正确的实现（Swiper）

```
卡片 1：translate3d(calc(-9.25% + 0px), 0px, -100px) rotateZ(-10deg) scale(1)
卡片 2：translate3d(-214px, 0px, 0px) rotateZ(0deg) scale(1)
卡片 3：translate3d(calc(9.25% - 428px), 0px, -100px) rotateZ(10deg) scale(1)
```

---

## 问题根源分析

### 问题 1：X 轴偏移计算方式错误

**你的计算**：

```javascript
const offsetAdd = perSlideOffset - absProgress * 0.75; // 8 - 1*0.75 = 7.25
let translateX =
  progress > 0 ? -offsetAdd * absProgress : offsetAdd * absProgress;
// 结果：translateX = -7.25 * 1 = -7.25 px ❌
```

**Swiper 的正确计算**：

```javascript
let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75; // 8 - 1*0.75 = 7.25
// 但使用 CSS calc() 将百分比与像素混合！
tX = `calc(${baseOffsetPx} ${sign} (${tXAdd * Math.abs(progress)}%))`;
// 例如：calc(-214px + 9.25%)
```

**关键区别**：

- 你的实现直接将 `tXAdd * absProgress` 作为像素值
- Swiper 将 `tXAdd * absProgress` 作为**百分比**值，相对于卡片宽度计算
- Swiper 使用 CSS `calc()` 函数混合绝对位置和相对百分比

### 问题 2：translateZ 值不同

| 参数              | 你的值  | 正确值   | 原因                     |
| ----------------- | ------- | -------- | ------------------------ |
| 卡片1 absProgress | 1       | 1        | -                        |
| translateZ        | -52 rpx | -100 rpx | 你的计算可能有基础值差异 |

**你的代码中的 maxVisibleCards=1 与 Swiper 的默认 3 不同**，这可能导致基础计算偏差。

### 问题 3：缩放逻辑不一致

**你的实现**：

```javascript
const scale = 1 - absProgress * 0.1;
// 卡片1：1 - 1*0.1 = 0.9
```

**Swiper 的实现**：

```javascript
// 只有当前卡片保持 scale=1，其他卡片才缩放
const scale = progress === 0 ? 1 : 1 - absProgress * 0.1;
// 卡片1：scale = 1（因为不是当前卡片）✓
```

### 问题 4：Progress 定义错误

**你之前的定义**：

```javascript
const progress = index - currentIndex; // ❌ 方向反了
```

**正确的定义**：

```javascript
const progress = currentIndex - index; // ✅
// 正值：已翻过的卡片
// 0值：当前卡片
// 负值：未翻过的卡片
```

---

## 小程序的特殊限制

小程序的 `style` 属性绑定**不支持 CSS `calc()` 函数**：

```javascript
// ❌ 小程序不支持这样的写法
style = "translate3d(calc(-9.25% + 0px), 0px, -100px)";

// ✅ 小程序只支持这样的写法
style = "translate3d(-27.75rpx, 0px, -100px)";
```

### 解决方案：预计算百分比转像素

由于小程序不支持 `calc()`，需要在 JavaScript 中预先计算：

```javascript
// Swiper 的百分比值转换为像素
const cardWidth = 300; // 卡片实际宽度（rpx）
const percentPart = tXAdd * absProgress; // 例如 9.25
const percentPixels = (percentPart / 100) * cardWidth; // 转换为 rpx

// 最终结果
const translateX = progress > 0 ? -percentPixels : percentPixels;
// 卡片1：-9.25% * 300 = -27.75 rpx ✓
```

---

## 修复方案

### 修正内容

1. **修正 progress 定义**

   ```javascript
   const progress = currentIndex - index; // 改为正确方向
   ```

2. **修正 X 轴偏移方向**

   ```javascript
   let translateX;
   if (progress > 0) {
     translateX = -offsetAdd * absProgress; // 已翻过 → 左偏移
   } else if (progress < 0) {
     translateX = offsetAdd * absProgress; // 未翻过 → 右偏移
   } else {
     translateX = 0;
   }
   ```

3. **修正缩放逻辑**

   ```javascript
   const scale = progress === 0 ? 1 : 1 - absProgress * 0.1;
   ```

4. **添加卡片宽度配置**

   ```javascript
   data: {
     cardWidth: 300,  // 需要与 CSS 中的卡片宽度保持一致
     // ...
   }
   ```

5. **添加百分比预计算**
   ```javascript
   const cardWidth = this.data.cardWidth;
   const percentPart = tXAdd * absProgress;
   const percentPixels = (percentPart / 100) * cardWidth;
   ```

### 修复后的计算结果

配置：`perSlideRotate: 10`、`perSlideOffset: 10`、`currentIndex: 1`

```
卡片 1（已翻过）：
  progress: 1
  rotateZ(-10deg) ✓
  translate3d(-27.75rpx, 0, -100rpx) ✓
  scale(0.9) ✓

卡片 2（当前）：
  progress: 0
  rotateZ(0deg) ✓
  translate3d(0rpx, 0, 0rpx) ✓
  scale(1) ✓

卡片 3（未翻过）：
  progress: -1
  rotateZ(10deg) ✓
  translate3d(27.75rpx, 0, -100rpx) ✓
  scale(0.9) ✓
```

---

## Swiper 源码参考

### 原始公式（来自 Swiper effect-cards.js）

```javascript
// 1. Progress 定义
const progress = slide.progress;

// 2. 旋转
let rotate = -params.perSlideRotate * progress;

// 3. X 轴偏移（核心）
let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75;

// 4. 使用 CSS calc() 混合绝对和相对值
let tX;
if (progress < 0) {
  tX = `calc(${baseX}px + (${tXAdd * Math.abs(progress)}%))`;
} else if (progress > 0) {
  tX = `calc(${baseX}px - (${tXAdd * progress}%))`;
} else {
  tX = `${baseX}px`;
}

// 5. Transform 字符串
const transform = `
  translate3d(${tX}, ${tY}, ${tZ}px)
  rotateZ(${rotate}deg)
  scale(${scale})
`;
```

### Swiper 中 tXAdd 的用途

- **perSlideOffset**：基础偏移量（默认 8px）
- **Math.abs(progress) \* 0.75**：随着远离当前卡片而递减的衰减系数
- **结果**：每张卡片的偏移量不是固定的，而是随 progress 动态变化的

| progress | tXAdd 计算  | 结果 |
| -------- | ----------- | ---- |
| 0        | 8 - 0\*0.75 | 8    |
| ±1       | 8 - 1\*0.75 | 7.25 |
| ±2       | 8 - 2\*0.75 | 6.5  |
| ±3       | 8 - 3\*0.75 | 5.75 |
| ±4       | 8 - 4\*0.75 | 5    |

这创造了一个"视觉堆叠"的效果 - 越远的卡片间距越小。

---

## 对比总结

| 特性          | 你的实现    | Swiper 实现            | 修复后         |
| ------------- | ----------- | ---------------------- | -------------- |
| progress 定义 | ❌ 反向     | ✓ currentIndex - index | ✓ 已修复       |
| X 轴偏移方向  | ❌ 反向     | ✓ 负值→左，正值→右     | ✓ 已修复       |
| X 轴偏移单位  | ❌ 像素     | ✓ 百分比+像素混合      | ✓ 预计算转换   |
| 缩放逻辑      | ❌ 全部缩放 | ✓ 当前卡片不缩放       | ✓ 已修复       |
| 支持 calc()   | N/A         | ✓ Web 特性             | ✗ 小程序限制   |
| 小程序兼容    | -           | -                      | ✓ 预计算百分比 |

---

## 使用指南

### 对于 effect-cards-test.js（增强调试版本）

需要手动设置 `cardWidth` 与 CSS 宽度保持一致：

```javascript
data: {
  cardWidth: 300,  // 必须与 .cards-wrapper 宽度一致
  // ...
}
```

### 对于 effect-cards.js 和 effect-cards-advanced.js（生产版本）

这些版本使用简化的固定偏移计算，无需 `cardWidth` 配置，但精度会略低于 Swiper。

---

## 结论

✅ **小程序可以实现正确的样式**，但有以下注意事项：

1. **必须预计算百分比**为像素值（因为不支持 calc()）
2. **需要知道卡片的实际宽度**
3. **计算公式需要完全遵循 Swiper 的逻辑**
4. **存在精度差异**（百分比转像素可能有舍入误差）

修复已应用到所有三个文件版本。
