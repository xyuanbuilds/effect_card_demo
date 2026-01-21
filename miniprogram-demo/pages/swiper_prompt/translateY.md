好问题！让我仔细分析 effect-cards 中 translateZ 和 translateY 的配合机制。

**Files Read:**

**/Users/xy/Dev/swiper/src/modules/effect-cards/effect-cards.mjs**

```
import createShadow from '../../shared/create-shadow.mjs';
import effectInit from '../../shared/effect-init.mjs';
import effectTarget from '../../shared/effect-target.mjs';
import effectVirtualTransitionEnd from '../../shared/effect-virtual-transition-end.mjs';
import { getSlideTransformEl } from '../../shared/utils.mjs';

export default function EffectCards({ swiper, extendParams, on }) {
  extendParams({
    cardsEffect: {
      slideShadows: true,
      rotate: true,
      perSlideRotate: 2,
      perSlideOffset: 8,
    },
  });

  const setTranslate = () => {
    const { slides, activeIndex, rtlTranslate: rtl } = swiper;
    const params = swiper.params.cardsEffect;
    const { startTranslate, isTouched } = swiper.touchEventsData;
    const currentTranslate = rtl ? -swiper.translate : swiper.translate;
    for (let i = 0; i < slides.length; i += 1) {
      const slideEl = slides[i];
      const slideProgress = slideEl.progress;
      const progress = Math.min(Math.max(slideProgress, -4), 4);
      let offset = slideEl.swiperSlideOffset;
      if (swiper.params.centeredSlides && !swiper.params.cssMode) {
        swiper.wrapperEl.style.transform = `translateX(${swiper.minTranslate()}px)`;
      }
      if (swiper.params.centeredSlides && swiper.params.cssMode) {
        offset -= slides[0].swiperSlideOffset;
      }
      let tX = swiper.params.cssMode ? -offset - swiper.translate : -offset;
      let tY = 0;
      const tZ = -100 * Math.abs(progress);
      let scale = 1;
      let rotate = -params.perSlideRotate * progress;

      let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75;

      const slideIndex =
        swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.from + i : i;

      const isSwipeToNext =
        (slideIndex === activeIndex || slideIndex === activeIndex - 1) &&
        progress > 0 &&
        progress < 1 &&
        (isTouched || swiper.params.cssMode) &&
        currentTranslate < startTranslate;
      const isSwipeToPrev =
        (slideIndex === activeIndex || slideIndex === activeIndex + 1) &&
        progress < 0 &&
        progress > -1 &&
        (isTouched || swiper.params.cssMode) &&
        currentTranslate > startTranslate;

      if (isSwipeToNext || isSwipeToPrev) {
        const subProgress = (1 - Math.abs((Math.abs(progress) - 0.5) / 0.5)) ** 0.5;
        rotate += -28 * progress * subProgress;
        scale += -0.5 * subProgress;
        tXAdd += 96 * subProgress;
        tY = `${
          (params.rotate || swiper.isHorizontal() ? -25 : 0) * subProgress * Math.abs(progress)
        }%`;
      }
      if (progress < 0) {
        // next
        tX = `calc(${tX}px ${rtl ? '-' : '+'} (${tXAdd * Math.abs(progress)}%))`;
      } else if (progress > 0) {
        // prev
        tX = `calc(${tX}px ${rtl ? '-' : '+'} (-${tXAdd * Math.abs(progress)}%))`;
      } else {
        tX = `${tX}px`;
      }
      if (!swiper.isHorizontal()) {
        const prevY = tY;
        tY = tX;
        tX = prevY;
      }

      const scaleString =
        progress < 0 ? `${1 + (1 - scale) * progress}` : `${1 - (1 - scale) * progress}`;

      /* eslint-disable */
      const transform = `
        translate3d(${tX}, ${tY}, ${tZ}px)
        rotateZ(${params.rotate ? (rtl ? -rotate : rotate) : 0}deg)
        scale(${scaleString})
      `;
      /* eslint-enable */

      if (params.slideShadows) {
        // Set shadows
        let shadowEl = slideEl.querySelector('.swiper-slide-shadow');
        if (!shadowEl) {
          shadowEl = createShadow('cards', slideEl);
        }
        if (shadowEl)
          shadowEl.style.opacity = Math.min(Math.max((Math.abs(progress) - 0.5) / 0.5, 0), 1);
      }

      slideEl.style.zIndex = -Math.abs(Math.round(slideProgress)) + slides.length;
      const targetEl = effectTarget(params, slideEl);
      targetEl.style.transform = transform;
    }
  };

  const setTransition = (duration) => {
    const transformElements = swiper.slides.map((slideEl) => getSlideTransformEl(slideEl));
    transformElements.forEach((el) => {
      el.style.transitionDuration = `${duration}ms`;
      el.querySelectorAll('.swiper-slide-shadow').forEach((shadowEl) => {
        shadowEl.style.transitionDuration = `${duration}ms`;
      });
    });

    effectVirtualTransitionEnd({ swiper, duration, transformElements });
  };

  effectInit({
    effect: 'cards',
    swiper,
    on,
    setTranslate,
    setTransition,
    perspective: () => true,
    overwriteParams: () => ({
      _loopSwapReset: false,
      watchSlidesProgress: true,
      loopAdditionalSlides: swiper.params.cardsEffect.rotate ? 3 : 2,
      centeredSlides: true,
      virtualTranslate: !swiper.params.cssMode,
    }),
  });
}

```

现在让我检查一下 effectInit 和 perspective 相关的代码，看看是否有 CSS perspective 的设置：

**Files Read:**

**/Users/xy/Dev/swiper/src/shared/effect-init.mjs**

```
export default function effectInit(params) {
  const {
    effect,
    swiper,
    on,
    setTranslate,
    setTransition,
    overwriteParams,
    perspective,
    recreateShadows,
    getEffectParams,
  } = params;

  on('beforeInit', () => {
    if (swiper.params.effect !== effect) return;
    swiper.classNames.push(`${swiper.params.containerModifierClass}${effect}`);
    if (perspective && perspective()) {
      swiper.classNames.push(`${swiper.params.containerModifierClass}3d`);
    }

    const overwriteParamsResult = overwriteParams ? overwriteParams() : {};

    Object.assign(swiper.params, overwriteParamsResult);
    Object.assign(swiper.originalParams, overwriteParamsResult);
  });
  on('setTranslate _virtualUpdated', () => {
    if (swiper.params.effect !== effect) return;
    setTranslate();
  });
  on('setTransition', (_s, duration) => {
    if (swiper.params.effect !== effect) return;
    setTransition(duration);
  });

  on('transitionEnd', () => {
    if (swiper.params.effect !== effect) return;
    if (recreateShadows) {
      if (!getEffectParams || !getEffectParams().slideShadows) return;
      // remove shadows
      swiper.slides.forEach((slideEl) => {
        slideEl
          .querySelectorAll(
            '.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left',
          )
          .forEach((shadowEl) => shadowEl.remove());
      });
      // create new one
      recreateShadows();
    }
  });

  let requireUpdateOnVirtual;
  on('virtualUpdate', () => {
    if (swiper.params.effect !== effect) return;
    if (!swiper.slides.length) {
      requireUpdateOnVirtual = true;
    }
    requestAnimationFrame(() => {
      if (requireUpdateOnVirtual && swiper.slides && swiper.slides.length) {
        setTranslate();
        requireUpdateOnVirtual = false;
      }
    });
  });
}

```

让我检查一下 Swiper 的 CSS 文件，看看 3D perspective 是如何设置的：

**Grep Results:**

- **/Users/xy/Dev/swiper/src/modules/effect-cards/effect-cards.mjs**
- **/Users/xy/Dev/swiper/src/modules/effect-flip/effect-flip.mjs**
- **/Users/xy/Dev/swiper/src/modules/effect-creative/effect-creative.mjs**
- **/Users/xy/Dev/swiper/src/shared/effect-init.mjs**
- **/Users/xy/Dev/swiper/src/modules/effect-coverflow/effect-coverflow.mjs**
- **/Users/xy/Dev/swiper/src/modules/effect-cube/effect-cube.mjs**
- **/Users/xy/Dev/swiper/src/swiper-effect-utils.d.ts**
- **/Users/xy/Dev/swiper/src/swiper.css**
- **/Users/xy/Dev/swiper/src/types/modules/effect-creative.d.ts**

**Files Read:**

**/Users/xy/Dev/swiper/src/swiper.css**

```
:root {
  --swiper-theme-color: #007aff;
  /*
  --swiper-preloader-color: var(--swiper-theme-color);
  --swiper-wrapper-transition-timing-function: initial;
  */
}
:host {
  position: relative;
  display: block;
  margin-left: auto;
  margin-right: auto;
  z-index: 1;
}
.swiper {
  margin-left: auto;
  margin-right: auto;
  position: relative;
  overflow: hidden;
  list-style: none;
  padding: 0;
  /* Fix of Webkit flickering */
  z-index: 1;
  display: block;
}
.swiper-vertical > .swiper-wrapper {
  flex-direction: column;
}
.swiper-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  transition-property: transform;
  transition-timing-function: var(--swiper-wrapper-transition-timing-function, initial);
  box-sizing: content-box;
}
.swiper-android .swiper-slide,
.swiper-ios .swiper-slide,
.swiper-wrapper {
  transform: translate3d(0px, 0, 0);
}
.swiper-horizontal {
  touch-action: pan-y;
}
.swiper-vertical {
  touch-action: pan-x;
}
.swiper-slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  position: relative;
  transition-property: transform;
  display: block;
}
.swiper-slide-invisible-blank {
  visibility: hidden;
}
/* Auto Height */
.swiper-autoheight,
.swiper-autoheight .swiper-slide {
  height: auto;
}
.swiper-autoheight .swiper-wrapper {
  align-items: flex-start;
  transition-property: transform, height;
}
.swiper-backface-hidden .swiper-slide {
  transform: translateZ(0);
  backface-visibility: hidden;
}
/* 3D Effects */
.swiper-3d.swiper-css-mode .swiper-wrapper {
  perspective: 1200px;
}
.swiper-3d .swiper-wrapper {
  transform-style: preserve-3d;
}
.swiper-3d {
  perspective: 1200px;
  .swiper-slide,
  .swiper-cube-shadow {
    transform-style: preserve-3d;
  }
}

/* CSS Mode */
.swiper-css-mode {
  > .swiper-wrapper {
    overflow: auto;
    scrollbar-width: none; /* For Firefox */
    -ms-overflow-style: none; /* For Internet Explorer and Edge */
    &::-webkit-scrollbar {
      display: none;
    }
  }
  > .swiper-wrapper > .swiper-slide {
    scroll-snap-align: start start;
  }
  &.swiper-horizontal {
    > .swiper-wrapper {
      scroll-snap-type: x mandatory;
    }
  }
  &.swiper-vertical {
    > .swiper-wrapper {
      scroll-snap-type: y mandatory;
    }
  }
  &.swiper-free-mode {
    > .swiper-wrapper {
      scroll-snap-type: none;
    }
    > .swiper-wrapper > .swiper-slide {
      scroll-snap-align: none;
    }
  }
  &.swiper-centered {
    > .swiper-wrapper::before {
      content: '';
      flex-shrink: 0;
      order: 9999;
    }
    > .swiper-wrapper > .swiper-slide {
      scroll-snap-align: center center;
      scroll-snap-stop: always;
    }
  }
  &.swiper-centered.swiper-horizontal {
    > .swiper-wrapper > .swiper-slide:first-child {
      margin-inline-start: var(--swiper-centered-offset-before);
    }
    > .swiper-wrapper::before {
      height: 100%;
      min-height: 1px;
      width: var(--swiper-centered-offset-after);
    }
  }
  &.swiper-centered.swiper-vertical {
    > .swiper-wrapper > .swiper-slide:first-child {
      margin-block-start: var(--swiper-centered-offset-before);
    }
    > .swiper-wrapper::before {
      width: 100%;
      min-width: 1px;
      height: var(--swiper-centered-offset-after);
    }
  }
}

/* Slide styles start */
/* 3D Shadows */
.swiper-3d {
  .swiper-slide-shadow,
  .swiper-slide-shadow-left,
  .swiper-slide-shadow-right,
  .swiper-slide-shadow-top,
  .swiper-slide-shadow-bottom,
  .swiper-slide-shadow,
  .swiper-slide-shadow-left,
  .swiper-slide-shadow-right,
  .swiper-slide-shadow-top,
  .swiper-slide-shadow-bottom {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }
  .swiper-slide-shadow {
    background: rgba(0, 0, 0, 0.15);
  }
  .swiper-slide-shadow-left {
    background-image: linear-gradient(to left, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  }
  .swiper-slide-shadow-right {
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  }
  .swiper-slide-shadow-top {
    background-image: linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  }
  .swiper-slide-shadow-bottom {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  }
}
.swiper-lazy-preloader {
  width: 42px;
  height: 42px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -21px;
  margin-top: -21px;
  z-index: 10;
  transform-origin: 50%;
  box-sizing: border-box;
  border: 4px solid var(--swiper-preloader-color, var(--swiper-theme-color));
  border-radius: 50%;
  border-top-color: transparent;
}
.swiper:not(.swiper-watch-progress),
.swiper-watch-progress .swiper-slide-visible {
  .swiper-lazy-preloader {
    animation: swiper-preloader-spin 1s infinite linear;
  }
}
.swiper-lazy-preloader-white {
  --swiper-preloader-color: #fff;
}
.swiper-lazy-preloader-black {
  --swiper-preloader-color: #000;
}
@keyframes swiper-preloader-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
/* Slide styles end */

```

## TranslateZ 与 TranslateY 的配合机制

### 1. **CSS Perspective 的作用**

首先，effect-cards 通过 `effectInit` 启用了 3D 透视：

```javascript
effectInit({
  effect: "cards",
  perspective: () => true, // 启用 3D 透视
  // ...
});
```

这会给容器添加 `swiper-3d` 类，从 `swiper.css` 第 81-82 行可以看到：

```css
.swiper-3d {
  perspective: 1200px; /* 透视距离 */
}
```

**Perspective 的含义**：设置观察者到 Z=0 平面的距离为 1200px。

### 2. **TranslateZ 产生的视觉效果**

在 effect-cards 中：

```javascript
const tZ = -100 * Math.abs(progress);
```

**负的 translateZ 值会让元素远离观察者**，产生以下效果：

```
progress = 0  → tZ = 0     (在 Z=0 平面，正常大小)
progress = ±1 → tZ = -100  (向后 100px，看起来更小)
progress = ±2 → tZ = -200  (向后 200px，更小)
progress = ±3 → tZ = -300  (向后 300px，更小)
```

### 3. **为什么需要 TranslateY？**

这是关键！当你使用 `translateZ` 负值时，如果没有调整 Y 轴，会出现一个问题：

#### 问题演示：

想象一个卡片中心点在屏幕中心，当它 `translateZ(-100px)` 时：

```
在 3D 空间中，透视投影会导致：
- 卡片看起来变小了 ✓
- 但卡片的投影位置会向上偏移 ✗（这就是"上提"现象）
```

这是因为**透视投影的特性**：Z 轴负值不仅让物体变小，还会改变它在 2D 屏幕上的投影位置。

### 4. **Effect-Cards 的解决方案**

看代码第 62-64 行：

```javascript
tY = `${
  (params.rotate || swiper.isHorizontal() ? -25 : 0) *
  subProgress *
  Math.abs(progress)
}%`;
```

**核心逻辑**：

1. **只在滑动过程中应用**：只有当 `isSwipeToNext` 或 `isSwipeToPrev` 为 true 时才设置 tY
2. **使用百分比单位**：`-25%` 表示向下偏移卡片高度的 25%
3. **与 progress 成正比**：`Math.abs(progress)` 确保偏移量随着 Z 轴深度增加
4. **使用 subProgress 平滑过渡**：使过渡更自然

### 5. **数学原理**

为了理解为什么是 `-25%`，我们需要理解透视投影公式：

```
投影 Y 坐标 = Y / (1 - Z / perspective)
```

当 Z = -100, perspective = 1200 时：

```
投影比例 = 1 / (1 - (-100) / 1200)
        = 1 / (1 + 100/1200)
        = 1 / 1.083
        ≈ 0.923
```

元素被缩小到约 92.3%，同时投影位置也会改变。

**TranslateY 的作用**：通过向下移动来**补偿透视引起的位置偏移**。

### 6. **完整的 Transform 组合**

```javascript
const transform = `
  translate3d(${tX}, ${tY}, ${tZ}px)
  rotateZ(${params.rotate ? (rtl ? -rotate : rotate) : 0}deg)
  scale(${scaleString})
`;
```

各部分的协同作用：

| Transform    | 作用                 | 防止上提的贡献      |
| ------------ | -------------------- | ------------------- |
| `translateZ` | 创建深度感，卡片后退 | ❌ 会导致位置偏移   |
| `translateY` | 向下补偿位置         | ✅ **核心补偿机制** |
| `rotateZ`    | 旋转效果             | 中性                |
| `scale`      | 额外缩放调整         | 辅助视觉效果        |

### 7. **关键细节：只在滑动时应用**

注意 tY 不是一直都有值：

```javascript
let tY = 0;  // 初始为 0

// 只在滑动过程中设置
if (isSwipeToNext || isSwipeToPrev) {
  tY = `${...}%`;  // 设置补偿值
}
```

**原因**：

- **静止状态**：当前卡片 (progress=0) 的 tZ=0，不需要补偿
- **滑动状态**：相邻卡片正在移动，tZ 变化，需要动态补偿
- **远离卡片**：progress 超出 [-1, 1] 范围的卡片已经在后面，轻微上提不明显

### 8. **为什么是 -25%？**

这个值是**经验调整**的结果，考虑了：

1. **透视比例**：perspective=1200px, tZ 最大约-300px
2. **视觉平衡**：不是精确的数学补偿，而是让视觉效果最佳
3. **与 subProgress 配合**：在滑动中点 (subProgress≈1) 时效果最强

### 9. **水平 vs 垂直模式**

```javascript
if (!swiper.isHorizontal()) {
  const prevY = tY;
  tY = tX;
  tX = prevY;
}
```

垂直模式下交换 X 和 Y，确保补偿方向正确。

---

## 总结

**防止卡片上提的核心机制**：

1. ✅ **CSS perspective: 1200px** - 设置 3D 空间
2. ✅ **translateZ 负值** - 让卡片后退产生深度
3. ✅ **translateY 负值 (-25%)** - 向下补偿透视引起的位置偏移
4. ✅ **只在滑动时应用** - 优化性能和视觉效果
5. ✅ **配合 subProgress** - 让过渡平滑自然

没有 translateY 的补偿，卡片在 Z 轴后退时会因为透视投影的特性而在屏幕上显得"上提"，通过精心调整的 Y 轴负偏移，完美抵消了这个效果，让卡片堆叠看起来更自然！
