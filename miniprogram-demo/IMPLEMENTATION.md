# EffectCards 小程序实现详解

## 核心原理对比

### Swiper EffectCards (Web)
```javascript
// Swiper 使用 DOM 操作和 CSS transforms
slides.forEach((slide, index) => {
  const progress = index - activeIndex;
  const transform = `
    translate3d(${tX}px, ${tY}px, ${tZ}px)
    rotateZ(${rotate}deg)
    scale(${scale})
  `;
  slide.style.transform = transform;
});
```

### 小程序版 (Mini-Program)
```javascript
// 小程序使用数据驱动，通过 setData 更新样式
const updatedCards = cards.map((card, index) => {
  const progress = index - currentIndex;
  const style = `transform: translate3d(...)`;
  return { ...card, style };
});
this.setData({ cards: updatedCards });
```

## 关键差异与适配

### 1. 事件系统

**Web (Swiper)**
```javascript
element.addEventListener('touchstart', handler);
element.addEventListener('touchmove', handler);
element.addEventListener('touchend', handler);
```

**小程序**
```xml
<view
  catchtouchstart="onTouchStart"
  catchtouchmove="onTouchMove"
  catchtouchend="onTouchEnd"
/>
```

### 2. 样式绑定

**Web (Swiper)**
```javascript
slide.style.transform = 'translate3d(...)';
slide.style.zIndex = 100;
```

**小程序**
```xml
<view style="{{item.style}}" />
```
```javascript
style: `transform: translate3d(...); z-index: 100;`
```

### 3. 单位系统

**Web**: 使用 `px`
**小程序**: 使用 `rpx` (responsive pixel，自适应不同屏幕)

```javascript
// 1rpx = 屏幕宽度 / 750
const translateX = 8; // Swiper 中的 8px
const translateXRpx = 8; // 小程序中对应 8rpx
```

## 核心算法实现

### 计算卡片变换

```javascript
/**
 * 基于 Swiper 源码的核心算法
 */
function calculateCardTransform(index, currentIndex, config) {
  // 1. 计算 progress（卡片位置）
  const progress = index - currentIndex;
  const absProgress = Math.abs(progress);

  // 2. Z 轴深度（参考 Swiper: tZ = -100 * |progress|）
  const translateZ = -100 * absProgress;

  // 3. 旋转角度（参考 Swiper: rotate = -2 * progress）
  const rotate = -config.perSlideRotate * progress;

  // 4. X 轴偏移（参考 Swiper: tXAdd = 8 - |progress| * 0.75）
  const offsetAdd = config.perSlideOffset - absProgress * 0.75;
  const translateX = progress > 0
    ? offsetAdd * absProgress
    : -offsetAdd * absProgress;

  // 5. 缩放（参考 Swiper: scale = 1 - |progress| * 0.x）
  const scale = 1 - absProgress * 0.1;

  // 6. 层级
  const zIndex = 100 - absProgress;

  // 7. 阴影
  const shadowOpacity = Math.min(absProgress * 0.3, 0.5);

  return {
    transform: `
      translate3d(${translateX}rpx, 0, ${translateZ}rpx)
      rotateZ(${rotate}deg)
      scale(${scale})
    `,
    zIndex,
    shadowOpacity
  };
}
```

### 手势跟随效果

```javascript
onTouchMove(e) {
  const deltaX = e.touches[0].pageX - this.data.touchStartX;

  // 关键：实时更新当前卡片的 transform
  // 参考 Swiper 的跟手逻辑
  const currentCard = this.data.cards[this.data.currentIndex];
  const enhancedRotate = (deltaX / 10) * 0.5; // 增强旋转
  const enhancedTranslateX = deltaX * 0.5;    // 跟手偏移

  this.updateCardsStyle(deltaX);
}
```

### 切换判定

```javascript
onTouchEnd() {
  const { touchMoveX, currentIndex } = this.data;
  const threshold = 80; // 滑动阈值（px）

  // 参考 Swiper 的阈值判定逻辑
  if (Math.abs(touchMoveX) > threshold) {
    const newIndex = touchMoveX < 0
      ? currentIndex + 1  // 向左滑
      : currentIndex - 1; // 向右滑

    this.switchToCard(newIndex);
  } else {
    // 回弹到原位
    this.updateCardsStyle();
  }
}
```

## 性能优化

### 1. 限制可见卡片数量
```javascript
const maxVisibleCards = 3;
if (Math.abs(progress) > maxVisibleCards) {
  return {
    style: 'opacity: 0; z-index: -1;',
    shadowStyle: 'opacity: 0;'
  };
}
```

### 2. 使用 will-change
```css
.card-item {
  will-change: transform;
  transform-style: preserve-3d;
}
```

### 3. 避免频繁 setData
```javascript
// ❌ 不好：每次都 setData
onTouchMove(e) {
  this.setData({ touchX: e.touches[0].pageX });
}

// ✅ 好：批量更新
onTouchMove(e) {
  this.touchData = { x: e.touches[0].pageX };
}
onTouchEnd() {
  this.setData({ ...this.touchData });
}
```

## 与 Swiper 源码的对应关系

| 功能 | Swiper 实现 | 小程序实现 |
|------|------------|-----------|
| 初始化 | `beforeInit` hook | `onLoad()` |
| 变换计算 | `setTranslate()` | `updateCardsStyle()` |
| 过渡动画 | `setTransition()` | CSS `transition` |
| 触摸事件 | `onTouchStart/Move/End` | `catchtouchstart/move/end` |
| 进度追踪 | `watchSlidesProgress: true` | 手动计算 `progress` |
| 虚拟变换 | `virtualTranslate: true` | 默认行为 |

## 公式对照表

```javascript
// Swiper 原始公式（effect-cards.mjs）
tZ = -100 * Math.abs(progress)
rotate = -2 * progress
tXAdd = 8 - Math.abs(progress) * 0.75
scale = 1 - Math.abs(progress) * 0.x
shadowOpacity = progress * opacity

// 小程序适配版本
translateZ = -100 * absProgress
rotate = -perSlideRotate * progress
offsetAdd = perSlideOffset - absProgress * 0.75
scale = 1 - absProgress * 0.1
shadowOpacity = Math.min(absProgress * 0.3, 0.5)
```

## 扩展功能实现

### Loop 模式（循环播放）
```javascript
onTouchEnd() {
  let newIndex = this.data.currentIndex + direction;

  // 循环逻辑
  if (newIndex >= this.data.cards.length) {
    newIndex = 0;
  } else if (newIndex < 0) {
    newIndex = this.data.cards.length - 1;
  }

  this.switchToCard(newIndex);
}
```

### 自动播放
```javascript
startAutoPlay() {
  this.timer = setInterval(() => {
    const nextIndex = (this.data.currentIndex + 1) % this.data.cards.length;
    this.switchToCard(nextIndex);
  }, 3000);
}

onUnload() {
  clearInterval(this.timer);
}
```

### 动态添加卡片
```javascript
addCard(newCard) {
  const cards = [...this.data.cards, newCard];
  this.setData({ cards }, () => {
    this.updateCardsStyle();
  });
}
```

## 调试技巧

### 1. 可视化 progress 值
```xml
<view class="debug">
  <text>Index: {{index}}, Progress: {{progress}}</text>
</view>
```

### 2. 性能监控
```javascript
onTouchMove() {
  const startTime = Date.now();
  this.updateCardsStyle(deltaX);
  console.log('Update time:', Date.now() - startTime, 'ms');
}
```

### 3. Transform 调试
```javascript
console.log({
  translateX,
  translateY,
  translateZ,
  rotate,
  scale,
  zIndex
});
```

## 常见问题

### Q: 为什么卡片不显示？
A: 检查 `perspective` 和 `transform-style: preserve-3d` 是否设置。

### Q: 为什么滑动不流畅？
A:
1. 检查是否有频繁的 `setData`
2. 限制 `maxVisibleCards` 数量
3. 使用 `catchtouchmove` 而非 `bindtouchmove`

### Q: 如何适配不同屏幕？
A: 使用 `rpx` 单位，小程序会自动适配。

## 总结

小程序版 EffectCards 完整复刻了 Swiper 的核心算法，通过：
1. **数据驱动**替代 DOM 操作
2. **rpx 单位**实现响应式
3. **手势系统**实现交互
4. **CSS3 transforms**实现 3D 效果

核心公式和逻辑与 Swiper 源码保持一致，确保相同的视觉效果。
