好的，让我深入研究 `progress` 的含义和计算方式。

**Grep Results:**

- **/Users/xy/Dev/swiper/src/modules/effect-cards/effect-cards.mjs**
- **/Users/xy/Dev/swiper/src/core/update/updateSlidesProgress.mjs**
- **/Users/xy/Dev/swiper/src/modules/effect-creative/effect-creative.mjs**
- **/Users/xy/Dev/swiper/src/modules/parallax/parallax.mjs**

**Files Read:**

**/Users/xy/Dev/swiper/src/core/update/updateSlidesProgress.mjs**

```
const toggleSlideClasses = (slideEl, condition, className) => {
  if (condition && !slideEl.classList.contains(className)) {
    slideEl.classList.add(className);
  } else if (!condition && slideEl.classList.contains(className)) {
    slideEl.classList.remove(className);
  }
};

export default function updateSlidesProgress(translate = (this && this.translate) || 0) {
  const swiper = this;
  const params = swiper.params;

  const { slides, rtlTranslate: rtl, snapGrid } = swiper;

  if (slides.length === 0) return;
  if (typeof slides[0].swiperSlideOffset === 'undefined') swiper.updateSlidesOffset();

  let offsetCenter = -translate;
  if (rtl) offsetCenter = translate;

  swiper.visibleSlidesIndexes = [];
  swiper.visibleSlides = [];

  let spaceBetween = params.spaceBetween;
  if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
    spaceBetween = (parseFloat(spaceBetween.replace('%', '')) / 100) * swiper.size;
  } else if (typeof spaceBetween === 'string') {
    spaceBetween = parseFloat(spaceBetween);
  }

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    let slideOffset = slide.swiperSlideOffset;
    if (params.cssMode && params.centeredSlides) {
      slideOffset -= slides[0].swiperSlideOffset;
    }

    const slideProgress =
      (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) /
      (slide.swiperSlideSize + spaceBetween);
    const originalSlideProgress =
      (offsetCenter -
        snapGrid[0] +
        (params.centeredSlides ? swiper.minTranslate() : 0) -
        slideOffset) /
      (slide.swiperSlideSize + spaceBetween);
    const slideBefore = -(offsetCenter - slideOffset);
    const slideAfter = slideBefore + swiper.slidesSizesGrid[i];

    const isFullyVisible =
      slideBefore >= 0 && slideBefore <= swiper.size - swiper.slidesSizesGrid[i];

    const isVisible =
      (slideBefore >= 0 && slideBefore < swiper.size - 1) ||
      (slideAfter > 1 && slideAfter <= swiper.size) ||
      (slideBefore <= 0 && slideAfter >= swiper.size);
    if (isVisible) {
      swiper.visibleSlides.push(slide);
      swiper.visibleSlidesIndexes.push(i);
    }
    toggleSlideClasses(slide, isVisible, params.slideVisibleClass);
    toggleSlideClasses(slide, isFullyVisible, params.slideFullyVisibleClass);
    slide.progress = rtl ? -slideProgress : slideProgress;
    slide.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
  }
}

```

完美！现在让我再查看一些示例来更好地说明 progress 的含义：

**Files Read:**

**/Users/xy/Dev/swiper/src/core/update/index.mjs**

```
import updateSize from './updateSize.mjs';
import updateSlides from './updateSlides.mjs';
import updateAutoHeight from './updateAutoHeight.mjs';
import updateSlidesOffset from './updateSlidesOffset.mjs';
import updateSlidesProgress from './updateSlidesProgress.mjs';
import updateProgress from './updateProgress.mjs';
import updateSlidesClasses from './updateSlidesClasses.mjs';
import updateActiveIndex from './updateActiveIndex.mjs';
import updateClickedSlide from './updateClickedSlide.mjs';

export default {
  updateSize,
  updateSlides,
  updateAutoHeight,
  updateSlidesOffset,
  updateSlidesProgress,
  updateProgress,
  updateSlidesClasses,
  updateActiveIndex,
  updateClickedSlide,
};

```

现在让我创建一个详细的 progress 说明文档：

## Progress 的深度解析

### 1. **Progress 的定义**

`progress` (即代码中的 `slideProgress`) 是 Swiper 为每个 slide 计算的一个**相对位置值**，表示该 slide 相对于容器可视区域的位置关系。

### 2. **Progress 的计算公式**

根据 `updateSlidesProgress.mjs` 第 38-40 行：

```javascript
const slideProgress =
  (offsetCenter +
    (params.centeredSlides ? swiper.minTranslate() : 0) -
    slideOffset) /
  (slide.swiperSlideSize + spaceBetween);
```

**分子部分**：

- `offsetCenter`: 当前的偏移中心位置（负的 translate 值）
- `params.centeredSlides ? swiper.minTranslate() : 0`: 如果启用居中模式，加上最小平移值
- `slideOffset`: 当前 slide 的偏移位置
- **意义**：slide 距离容器中心的实际距离

**分母部分**：

- `slide.swiperSlideSize + spaceBetween`: slide 的宽度 + 间距
- **意义**：将距离标准化为 slide 单位

### 3. **Progress 值的含义**

```
progress = 0     → slide 位于容器中心（当前激活的 slide）
progress = -1    → slide 在中心右侧一个 slide 的距离（下一张）
progress = 1     → slide 在中心左侧一个 slide 的距离（上一张）
progress = -2    → slide 在中心右侧两个 slide 的距离
progress = 2     → slide 在中心左侧两个 slide 的距离
```

### 4. **在 effect-cards 中的应用**

```javascript
const slideProgress = slideEl.progress;
const progress = Math.min(Math.max(slideProgress, -4), 4);
```

Cards 效果将 progress **限制在 [-4, 4]** 范围内，这意味着：

- 只对前后各 4 张 slide 应用效果
- 超出范围的 slide 使用边界值

### 5. **Progress 在不同场景的变化**

#### 场景 1：初始状态（activeIndex = 0）

```
Slide 0: progress = 0   (当前激活，在中心)
Slide 1: progress = -1  (下一张，在右侧)
Slide 2: progress = -2  (再下一张)
Slide 3: progress = -3
```

#### 场景 2：滑动到 Slide 1 的过程中

```
当用户向左滑动 50% 时：
Slide 0: progress = 0.5   (正在离开中心，向左移)
Slide 1: progress = -0.5  (正在进入中心，从右移入)
Slide 2: progress = -1.5
```

#### 场景 3：滑动完成（activeIndex = 1）

```
Slide 0: progress = 1   (上一张，在左侧)
Slide 1: progress = 0   (当前激活，在中心)
Slide 2: progress = -1  (下一张，在右侧)
```

### 6. **Effect-Cards 中如何利用 Progress**

回到 effect-cards 的代码：

```javascript
// 基础变换计算
const tZ = -100 * Math.abs(progress); // Z 轴深度：越远越深
let rotate = -params.perSlideRotate * progress; // 旋转角度随 progress 变化
let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75; // 偏移量

// 判断是否在滑动过程中
const isSwipeToNext =
  (slideIndex === activeIndex || slideIndex === activeIndex - 1) &&
  progress > 0 &&
  progress < 1; // progress 在 (0, 1) 之间表示正在向前滑

const isSwipeToPrev =
  (slideIndex === activeIndex || slideIndex === activeIndex + 1) &&
  progress < 0 &&
  progress > -1; // progress 在 (-1, 0) 之间表示正在向后滑
```

### 7. **SubProgress 的作用**

```javascript
const subProgress = (1 - Math.abs((Math.abs(progress) - 0.5) / 0.5)) ** 0.5;
```

这是一个**缓动函数**，用于在滑动过程中创建更流畅的过渡：

```
progress = 0    → subProgress = 0.707  (中心位置)
progress = ±0.5 → subProgress = 1      (滑动中点，效果最强)
progress = ±1   → subProgress = 0.707  (滑动完成)
```

通过开平方根 (`** 0.5`)，创建了一个平滑的曲线，使卡片在滑动中间时有更明显的动画效果。

### 8. **RTL 模式的影响**

```javascript
const currentTranslate = rtl ? -swiper.translate : swiper.translate;
slide.progress = rtl ? -slideProgress : slideProgress;
```

在从右到左 (RTL) 的语言环境中，progress 的符号会反转，确保视觉效果与方向一致。

---

**总结**：`progress` 是 Swiper 的核心概念，它将 slide 的位置标准化为相对于容器中心的距离单位，使得各种效果模块能够基于统一的度量标准来实现不同的视觉效果。在 effect-cards 中，progress 决定了每张卡片的深度、旋转角度、偏移量和缩放比例。
