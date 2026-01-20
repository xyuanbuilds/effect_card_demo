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
    currentIndex: 0,

    // 核心参数（与 Swiper 默认值一致）
    perSlideRotate: 10, // 默认 10 度
    perSlideOffset: 10, // 默认 10 rpx
    maxVisibleCards: 3,

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
   * 核心算法：与 Swiper 完全一致的实现
   * 参考：https://github.com/nolimits4web/Swiper/commit/db08a70
   */
  updateCardsStyle(deltaX = 0) {
    const {
      currentIndex,
      perSlideRotate,
      perSlideOffset,
      maxVisibleCards,
      cards,
    } = this.data;

    const updatedCards = cards.map((card, index) => {
      // 计算 progress：大于 0 表示已翻过的卡片，放左侧；小于 0 表示未翻过，放右侧
      const progress = currentIndex - index;
      const absProgress = Math.abs(progress);

      // 超出可见范围
      if (absProgress > maxVisibleCards) {
        return {
          ...card,
          style: "opacity: 0; z-index: -1;",
          shadowStyle: "opacity: 0;",
          rotateAngle: 0,
          offsetValue: 0,
        };
      }

      // === Swiper 源码实现 ===
      // let rotate = -params.perSlideRotate * progress;
      let rotate = -perSlideRotate * progress;

      // 滑动时增强旋转（Swiper 同样实现）
      if (this.data.isSwiping && index === currentIndex) {
        const swipeRotate = (deltaX / 10) * 0.5;
        rotate += swipeRotate;
      }

      // === Swiper 源码实现 ===
      // let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75;
      const offsetAdd = perSlideOffset - absProgress * 0.75;
      let translateX =
        progress > 0 ? -offsetAdd * absProgress : offsetAdd * absProgress;

      // 滑动时跟手
      if (this.data.isSwiping && index === currentIndex) {
        translateX += deltaX * 0.5;
      }

      // Z 轴深度
      const translateZ = -100 * absProgress;

      // 缩放
      const scale = 1 - absProgress * 0.1;

      // Z-index
      const zIndex = 100 - absProgress;

      // 阴影
      const shadowOpacity = Math.min(absProgress * 0.3, 0.5);

      // 组合变换
      const transform = `
        translate3d(${translateX}rpx, 0, ${translateZ}rpx)
        rotateZ(${rotate}deg)
        scale(${scale})
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
        rotateAngle: rotate.toFixed(1), // 显示当前旋转角度
        offsetValue: translateX.toFixed(1), // 显示当前偏移量
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
});
