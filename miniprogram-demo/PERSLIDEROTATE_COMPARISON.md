# perSlideRotate 实现对比文档

## Swiper Web 版实现

根据 [GitHub commit db08a70](https://github.com/nolimits4web/Swiper/commit/db08a70fcde1c8a33c3dba29e2b4193f10fcbb98)，Swiper 的实现如下：

### 源码实现

```javascript
// effect-cards.js (Swiper v8+)
export default function EffectCards({ swiper, extendParams, on }) {
  extendParams({
    cardsEffect: {
      slideShadows: true,
      rotate: true,
      perSlideRotate: 2,    // ← 默认值 2 度
      perSlideOffset: 8,    // ← 默认值 8px
    },
  });

  const setTranslate = () => {
    const params = swiper.params.cardsEffect;

    slides.forEach((slide, index) => {
      const progress = slide.progress;

      // 核心旋转计算公式
      let rotate = -params.perSlideRotate * progress;  // ← 关键代码

      // 偏移计算公式
      let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75;

      // 应用变换
      slide.style.transform = `
        translate3d(${tX}px, ${tY}px, ${tZ}px)
        rotateZ(${rotate}deg)
        scale(${scale})
      `;
    });
  };
}
```

### 类型定义

```typescript
// effect-cards.d.ts
export interface CardsEffectOptions {
  /**
   * Rotate angle per slide (in degrees)
   * @default 2
   */
  perSlideRotate?: number;

  /**
   * Offset distance per slide (in px)
   * @default 8
   */
  perSlideOffset?: number;

  /**
   * Enable slide shadows
   * @default true
   */
  slideShadows?: boolean;

  /**
   * Enable rotation
   * @default true
   */
  rotate?: boolean;
}
```

## 小程序版实现

### 基础版（effect-cards.js）

```javascript
Page({
  data: {
    // ✅ 参数定义 - 与 Swiper 默认值一致
    perSlideRotate: 2,    // 每张卡片旋转角度（度）
    perSlideOffset: 8,    // 每张卡片偏移量（rpx）
  },

  updateCardsStyle(deltaX = 0, deltaY = 0) {
    const { perSlideRotate, perSlideOffset } = this.data;

    const updatedCards = cards.map((card, index) => {
      const progress = index - currentIndex;

      // ✅ 旋转计算 - 与 Swiper 完全一致
      let rotate = -perSlideRotate * progress;  // ← 关键代码

      // ✅ 偏移计算 - 与 Swiper 完全一致
      const offsetAdd = perSlideOffset - absProgress * 0.75;

      // ✅ 滑动时增强旋转（Swiper 同样有此逻辑）
      if (this.data.isSwiping && index === currentIndex) {
        const swipeRotate = (deltaX / 10) * 0.5;
        rotate += swipeRotate;
      }

      return {
        ...card,
        style: `transform: translate3d(...) rotateZ(${rotate}deg) scale(...);`
      };
    });
  }
});
```

### 增强版（effect-cards-advanced.js）

除了基础实现外，还增加了：

```javascript
// ✅ 实时参数调整
onRotateChange(e) {
  this.setData({
    perSlideRotate: e.detail.value  // 通过滑动条动态调整
  }, () => {
    this.updateCardsStyle();
  });
}
```

## 实现对比表

| 特性 | Swiper Web | 小程序版 | 一致性 |
|------|-----------|---------|--------|
| 参数名称 | `perSlideRotate` | `perSlideRotate` | ✅ 完全一致 |
| 默认值 | `2` | `2` | ✅ 完全一致 |
| 计算公式 | `-params.perSlideRotate * progress` | `-perSlideRotate * progress` | ✅ 完全一致 |
| 单位 | 度（deg） | 度（deg） | ✅ 完全一致 |
| 偏移公式 | `params.perSlideOffset - abs(progress) * 0.75` | `perSlideOffset - absProgress * 0.75` | ✅ 完全一致 |
| 滑动增强 | 有 | 有 | ✅ 完全一致 |
| 动态调整 | 支持 | 支持（增强版） | ✅ 完全一致 |

## 使用示例对比

### Swiper Web 版

```javascript
import { Swiper } from 'swiper';
import { EffectCards } from 'swiper/modules';

const swiper = new Swiper('.swiper', {
  effect: 'cards',
  cardsEffect: {
    perSlideRotate: 10,  // 自定义旋转角度
    perSlideOffset: 15,  // 自定义偏移量
  }
});
```

### React 组件（来自用户代码）

```tsx
<Swiper
  modules={[EffectCards]}
  effect="cards"
  cardsEffect={{
    perSlideRotate: 10,  // 设置为 10 度
    perSlideOffset: 10
  }}
>
  {/* slides */}
</Swiper>
```

### 小程序版（基础版）

```javascript
// effect-cards.js
data: {
  perSlideRotate: 10,  // 直接修改参数
  perSlideOffset: 10,
}
```

### 小程序版（增强版 - 动态调整）

```xml
<!-- effect-cards-advanced.wxml -->
<slider
  min="0"
  max="10"
  value="{{perSlideRotate}}"
  bindchange="onRotateChange"
/>
```

## 核心算法验证

### 测试用例 1：默认参数

```javascript
// 假设有 5 张卡片，当前在第 2 张（index = 1）

// 卡片 0：progress = 0 - 1 = -1
rotate = -2 * (-1) = 2°     // ✅ 向左旋转 2 度

// 卡片 1：progress = 1 - 1 = 0
rotate = -2 * 0 = 0°        // ✅ 当前卡片无旋转

// 卡片 2：progress = 2 - 1 = 1
rotate = -2 * 1 = -2°       // ✅ 向右旋转 2 度

// 卡片 3：progress = 3 - 1 = 2
rotate = -2 * 2 = -4°       // ✅ 向右旋转 4 度
```

### 测试用例 2：自定义参数（perSlideRotate = 10）

```javascript
// 卡片 0：progress = -1
rotate = -10 * (-1) = 10°   // ✅ 向左旋转 10 度

// 卡片 1：progress = 0
rotate = -10 * 0 = 0°       // ✅ 当前卡片无旋转

// 卡片 2：progress = 1
rotate = -10 * 1 = -10°     // ✅ 向右旋转 10 度
```

## 结论

✅ **小程序版本已经完整、正确地实现了 `perSlideRotate` 功能**

实现细节：
1. ✅ 参数名称与 Swiper 一致
2. ✅ 默认值与 Swiper 一致（2 度）
3. ✅ 计算公式与 Swiper 完全一致
4. ✅ 支持自定义配置
5. ✅ 增强版支持实时动态调整
6. ✅ 包含滑动增强效果

## 如何使用

### 方法 1：直接修改参数（基础版）

```javascript
// pages/effect-cards/effect-cards.js
data: {
  perSlideRotate: 10,  // 修改为你想要的角度
}
```

### 方法 2：使用增强版（推荐）

增强版提供了滑动条，可以实时预览不同角度的效果：

```
打开页面 → 调整"旋转角度"滑动条 → 实时查看效果
```

### 方法 3：封装为组件属性

```javascript
// 创建自定义组件
Component({
  properties: {
    perSlideRotate: {
      type: Number,
      value: 2
    }
  },

  methods: {
    updateCardsStyle() {
      const rotate = -this.data.perSlideRotate * progress;
      // ...
    }
  }
});
```

## 参考资料

- [Swiper CardsEffectOptions 文档](https://swiperjs.com/types/interfaces/types_modules_effect_cards.CardsEffectOptions)
- [Swiper perSlideRotate 实现 commit](https://github.com/nolimits4web/Swiper/commit/db08a70fcde1c8a33c3dba29e2b4193f10fcbb98)
- [Swiper Cards Effect 示例](https://swiperjs.com/demos#cards-effect)
