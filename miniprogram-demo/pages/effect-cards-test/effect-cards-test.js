/**
 * perSlideRotate 效果测试页面
 * 验证与 Swiper Web 版实现的一致性
 */

Page({
  data: {
    cards: [
      {
        id: "1",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        id: "2",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        id: "3",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        id: "4",
        gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      },
      {
        id: "5",
        gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      },
    ],
    currentIndex: 2,

    // 核心参数（与 Swiper 默认值一致）
    perSlideRotate: 10, // 默认 10 度
    perSlideOffset: 10, // 默认 10 rpx
    maxVisibleCards: 3,
    shadow: false, // 是否显示阴影效果

    // 卡片尺寸（用于百分比/交换距离计算）
    cardWidth: 300, // rpx，需要与 CSS 中的卡片宽度保持一致
    cardHeight: 400, // rpx，需要与 CSS 中的卡片高度保持一致

    // 旋转基准点
    transformOrigin: "center bottom", // 'center top' | 'center center' | 'center bottom'

    // 触摸状态
    touchStartX: 0,
    touchStartY: 0,
    isSwiping: false,
  },

  onLoad() {
    this.updateCardsStyle();
  },

  /**
   * 核心算法：完全遵循 Swiper 实现
   *
   * Swiper 的核心公式（来自 effect-cards.mjs）：
   * 1. progress = 卡片位置相对于当前卡片的偏移（滑动时是连续的小数）
   * 2. 通过 isSwipeToNext/isSwipeToPrev 判断滑动状态
   * 3. 使用 subProgress 计算平滑的过渡系数
   * 4. 动态调整 rotate, scale, tXAdd, tY
   *
   * 关键改动：使用动态 progress = baseProgress + swipeOffset
   */
  updateCardsStyle(deltaX = 0) {
    const {
      currentIndex,
      perSlideRotate,
      perSlideOffset,
      maxVisibleCards,
      cardWidth,
      cardHeight,
      cards,
    } = this.data;

    // 缩放向上补偿系数，更大后，拖放中的卡片会向上
    const translateYCompFactor = 0;
    const swapDistance = cardWidth / 2; // 完整交换所需滑动距离

    // 计算滑动偏移量（归一化到 -1 到 1）
    const swipeOffset = this.data.isSwiping ? -deltaX / swapDistance : 0;

    const updatedCards = cards.map((card, index) => {
      // ===== 1. 计算动态 progress（核心改动）=====
      const baseProgress = currentIndex - index;
      const progress = baseProgress + swipeOffset; // 滑动时连续变化
      const absProgress = Math.abs(progress);

      // maxVisibleCards 控制可见卡片数量
      if (Math.abs(baseProgress) > maxVisibleCards) {
        return {
          ...card,
          style: "opacity: 0; z-index: -1;",
          shadowStyle: "opacity: 0;",
          rotateAngle: 0,
          offsetValue: 0,
        };
      }

      // ===== 2. 初始化基础变换 =====
      let rotate = -perSlideRotate * progress;
      let tXAdd = perSlideOffset - absProgress * 0.75;
      let scale = 1;
      let tY = 0;

      // ===== 3. 判断是否在滑动到下一张/上一张（Swiper 逻辑）=====
      const isSwipeToNext =
        (index === currentIndex || index === currentIndex - 1) &&
        progress > 0 &&
        progress < 1 &&
        this.data.isSwiping &&
        deltaX < 0;

      const isSwipeToPrev =
        (index === currentIndex || index === currentIndex + 1) &&
        progress < 0 &&
        progress > -1 &&
        this.data.isSwiping &&
        deltaX > 0;

      // ===== 4. 应用 Swiper 的动态变换 =====
      if (isSwipeToNext || isSwipeToPrev) {
        const subProgress = Math.pow(
          1 - Math.abs((absProgress - 0.5) / 0.5),
          0.5,
        );

        rotate += -28 * progress * subProgress;
        scale += -0.5 * subProgress;
        tXAdd += 96 * subProgress;
        tY = -25 * subProgress * absProgress; // 百分比
      }

      // ===== 5. 计算 translateX =====
      const percentPixels = ((tXAdd * absProgress) / 100) * cardWidth;
      let translateX = 0;
      if (progress > 0) {
        translateX = -percentPixels;
      } else if (progress < 0) {
        translateX = percentPixels;
      }

      // ===== 6. 计算 translateY（补偿 + 动态偏移）=====
      let translateY = (tY / 100) * cardHeight;

      // ===== 7. 计算 translateZ =====
      const translateZ = -100 * 2 * absProgress;

      // ===== 8. 计算 scale 的最终值（Swiper 公式）=====
      const scaleString =
        progress < 0 ? 1 + (1 - scale) * progress : 1 - (1 - scale) * progress;

      // 添加缩放补偿到 translateY
      if (scaleString !== 1) {
        translateY += -(1 - scaleString) * cardHeight * translateYCompFactor;
      }

      // ===== 9. Z-index 计算 =====
      const zIndex = -Math.abs(Math.round(baseProgress)) + cards.length;

      // ===== 10. 阴影透明度 =====
      const shadowOpacity = Math.min(Math.max((absProgress - 0.5) / 0.5, 0), 1);

      // ===== 11. 组合变换 =====
      const transform = `
        translate3d(${translateX}rpx, ${translateY}rpx, ${translateZ}rpx)
        rotateZ(${rotate}deg)
        scale(${scaleString})
      `
        .replace(/\s+/g, " ")
        .trim();

      return {
        ...card,
        style: `
          transform: ${transform};
          transform-origin: ${this.data.transformOrigin};
          z-index: ${zIndex};
          opacity: 1;
        `,
        shadowStyle: `opacity: ${shadowOpacity};`,
        rotateAngle: rotate.toFixed(1),
        offsetValue: translateX.toFixed(1),
      };
    });

    this.setData({
      cards: updatedCards,
    });
  },

  /**
   * 滑动条实时调整（bindchanging）
   */
  onRotateChanging(e) {
    this.setData({
      perSlideRotate: e.detail.value,
    });
    this.updateCardsStyle();
  },

  onOffsetChanging(e) {
    this.setData({
      perSlideOffset: e.detail.value,
    });
    this.updateCardsStyle();
  },

  /**
   * 滑动条最终值（bindchange）
   */
  onRotateChange(e) {
    this.setData({
      perSlideRotate: e.detail.value,
    });
    this.updateCardsStyle();
    wx.vibrateShort({ type: "light" });
  },

  onOffsetChange(e) {
    this.setData({
      perSlideOffset: e.detail.value,
    });
    this.updateCardsStyle();
    wx.vibrateShort({ type: "light" });
  },

  /**
   * 可见卡片数量调整
   */
  onMaxVisibleCardsChanging(e) {
    this.setData({
      maxVisibleCards: e.detail.value,
    });
    this.updateCardsStyle();
  },

  onMaxVisibleCardsChange(e) {
    this.setData({
      maxVisibleCards: e.detail.value,
    });
    this.updateCardsStyle();
    wx.vibrateShort({ type: "light" });
  },

  /**
   * 卡片尺寸输入
   */
  onCardWidthInput(e) {
    this.setData({
      cardWidth: parseInt(e.detail.value) || 300,
    });
  },

  onCardHeightInput(e) {
    this.setData({
      cardHeight: parseInt(e.detail.value) || 400,
    });
  },

  onCardSizeBlur() {
    // 当输入框失去焦点时，更新卡片样式
    this.updateCardsStyle();
    wx.vibrateShort({ type: "light" });
  },

  /**
   * 阴影开关
   */
  onShadowChange(e) {
    this.setData({
      shadow: e.detail.value,
    });
    wx.vibrateShort({ type: "light" });
  },

  /**
   * 预设值快速切换
   */
  setPreset(e) {
    const { rotate, offset } = e.currentTarget.dataset;
    this.setData(
      {
        perSlideRotate: parseInt(rotate),
        perSlideOffset: parseInt(offset),
      },
      () => {
        this.updateCardsStyle();
        wx.vibrateShort({ type: "medium" });
      },
    );
  },

  /**
   * 设置旋转基准点
   */
  setOrigin(e) {
    const { origin } = e.currentTarget.dataset;
    this.setData(
      {
        transformOrigin: origin,
      },
      () => {
        this.updateCardsStyle();
        wx.vibrateShort({ type: "light" });
      },
    );
  },

  /**
   * 触摸事件
   */
  onTouchStart(e) {
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.pageX,
      isSwiping: true,
    });
  },

  onTouchMove(e) {
    const touch = e.touches[0];
    const deltaX = touch.pageX - this.data.touchStartX;
    this.updateCardsStyle(deltaX);
  },

  onTouchEnd(e) {
    const deltaX = e.changedTouches[0].pageX - this.data.touchStartX;
    const threshold = 80;

    let newIndex = this.data.currentIndex;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0 && this.data.currentIndex < this.data.cards.length - 1) {
        newIndex = this.data.currentIndex + 1;
      } else if (deltaX > 0 && this.data.currentIndex > 0) {
        newIndex = this.data.currentIndex - 1;
      }
      wx.vibrateShort({ type: "light" });
    }

    this.setData(
      {
        currentIndex: newIndex,
        isSwiping: false,
      },
      () => {
        this.updateCardsStyle();
      },
    );
  },

  /**
   * 切换到上一张
   */
  gotoPrev() {
    if (this.data.currentIndex > 0) {
      this.setData(
        {
          currentIndex: this.data.currentIndex - 1,
        },
        () => {
          this.updateCardsStyle();
          wx.vibrateShort({ type: "light" });
        },
      );
    }
  },

  /**
   * 切换到下一张
   */
  gotoNext() {
    if (this.data.currentIndex < this.data.cards.length - 1) {
      this.setData(
        {
          currentIndex: this.data.currentIndex + 1,
        },
        () => {
          this.updateCardsStyle();
          wx.vibrateShort({ type: "light" });
        },
      );
    }
  },
});
