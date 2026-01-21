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

## 核心逻辑分析

### 1. **主要变量计算** (第 17-40 行)

```javascript
const setTranslate = () => {
  const { slides, activeIndex, rtlTranslate: rtl } = swiper;
  const params = swiper.params.cardsEffect;
  const currentTranslate = rtl ? -swiper.translate : swiper.translate;
```

关键变量：

- `progress`: 每个 slide 的进度值，限制在 [-4, 4] 范围
- `tX/tY`: X/Y 轴平移值
- `tZ`: Z 轴深度，公式为 `-100 * Math.abs(progress)`
- `rotate`: 旋转角度，基础值为 `-params.perSlideRotate * progress`
- `scale`: 缩放比例，初始为 1
- `tXAdd`: 额外偏移量，初始为 `params.perSlideOffset - Math.abs(progress) * 0.75`

### 2. **滑动过程中的特殊处理** (第 44-65 行)

这是最关键的部分，处理滑动过程中的动态效果：

```javascript
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
```

**核心逻辑**：

- 检测是否正在向下一张或上一张滑动
- 使用 `subProgress` 计算平滑的过渡系数：

```javascript
const subProgress = (1 - Math.abs((Math.abs(progress) - 0.5) / 0.5)) ** 0.5;
```

- 滑动时动态调整：
  - `rotate += -28 * progress * subProgress` (额外旋转)
  - `scale += -0.5 * subProgress` (缩放变化)
  - `tXAdd += 96 * subProgress` (额外偏移)
  - `tY` 根据方向设置垂直偏移

### 3. **translate 值的最终计算** (第 66-79 行)

```javascript
if (progress < 0) {
  // 向后的卡片 (next)
  tX = `calc(${tX}px ${rtl ? "-" : "+"} (${tXAdd * Math.abs(progress)}%))`;
} else if (progress > 0) {
  // 向前的卡片 (prev)
  tX = `calc(${tX}px ${rtl ? "-" : "+"} (-${tXAdd * Math.abs(progress)}%))`;
} else {
  // 当前卡片
  tX = `${tX}px`;
}
```

**关键点**：

- 使用 `calc()` 结合像素值和百分比
- RTL（从右到左）模式下反转方向
- 垂直模式时交换 X 和 Y 值

### 4. **最终 transform 应用** (第 81-104 行)

```javascript
const scaleString =
  progress < 0
    ? `${1 + (1 - scale) * progress}`
    : `${1 - (1 - scale) * progress}`;

const transform = `
  translate3d(${tX}, ${tY}, ${tZ}px)
  rotateZ(${params.rotate ? (rtl ? -rotate : rotate) : 0}deg)
  scale(${scaleString})
`;

targetEl.style.transform = transform;
```

## 效果总结

Cards 效果的核心是通过以下参数创建卡片堆叠效果：

1. **Z 轴深度**：使卡片呈现层叠感
2. **X/Y 轴偏移**：产生错开的视觉效果
3. **旋转**：每张卡片有轻微的旋转角度
4. **缩放**：滑动时卡片大小有细微变化
5. **阴影透明度**：增强立体感

滑动时，通过 `subProgress` 这个平滑系数，让相邻卡片的过渡更加自然流畅。
