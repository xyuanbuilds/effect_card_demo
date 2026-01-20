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
    maxVisibleCards: 1,

    // 卡片尺寸（用于百分比计算）
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
   * 核心算法：修正版本，更接近 Swiper 实现
   *
   * Swiper 的核心公式（来自 effect-cards.js）：
   * 1. progress = 卡片位置相对于当前卡片的偏移（可以是小数）
   * 2. tXAdd = perSlideOffset - Math.abs(progress) * 0.75
   * 3. 使用 calc() 函数将百分比转换为像素
   * 4. scale 取决于卡片是否为当前卡片
   *
   * 注意：小程序不支持 calc() 函数，所以需要预先计算百分比
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

    const translateYCompFactor = 0.51; // 补偿系数，略大于0.5以抵消透视造成的视觉下坠
    const swapDistance = cardWidth / 2; // 完整交换所需滑动距离（公共变量）

    const updatedCards = cards.map((card, index) => {
      // 计算 progress：对应 Swiper 的 slide.progress
      // 正值表示已翻过（左侧），负值表示未翻过（右侧）
      const progress = currentIndex - index;
      const absProgress = Math.abs(progress);

      if (absProgress > maxVisibleCards) {
        return {
          ...card,
          style: "opacity: 0; z-index: -1;",
          shadowStyle: "opacity: 0;",
          rotateAngle: 0,
          offsetValue: 0,
        };
      }

      // ===== 旋转计算（与 Swiper 一致）=====
      // let rotate = -params.perSlideRotate * progress;
      let rotate = -perSlideRotate * progress;

      // 滑动时增强旋转
      if (this.data.isSwiping && index === currentIndex) {
        const swipeRotate = (deltaX / 10) * 0.5;
        rotate += swipeRotate;
      }

      // ===== X 轴偏移计算（修正版）=====
      // Swiper 公式：tXAdd = perSlideOffset - Math.abs(progress) * 0.75
      const tXAdd = perSlideOffset - absProgress * 0.75;

      // 计算百分比部分（Swiper 在 CSS 中使用 calc()，小程序需要预先计算）
      const percentPart = tXAdd * absProgress;
      // 百分比转换为实际像素（基于卡片宽度）
      const percentPixels = (percentPart / 100) * cardWidth;

      // 根据 progress 方向调整偏移
      let translateX;
      if (progress > 0) {
        // 已翻过的卡片，向左偏移
        translateX = -percentPixels;
      } else if (progress < 0) {
        // 未翻过的卡片，向右偏移
        translateX = percentPixels;
      } else {
        // 当前卡片，无偏移
        translateX = 0;
      }

      // 滑动时跟手
      if (this.data.isSwiping && index === currentIndex) {
        translateX += deltaX * 0.5;
      }

      // ===== Z 轴深度（固定单位递进）=====
      // translateZ = -progress * 100
      // 每张卡片之间相差 100px
      // 已翻过的卡片负值（向前），未翻过的正值（向后）
      let translateZ = -absProgress * 100 * 2;

      // 滑动时，动态调整当前卡与目标卡的 Z 轴深度，使目标卡逐渐浮到前面
      if (this.data.isSwiping && deltaX !== 0) {
        const swipeProgress = Math.min(Math.abs(deltaX) / swapDistance, 1);

        if (deltaX < 0) {
          // 向左滑 → 目标卡是 currentIndex + 1
          if (index === currentIndex) {
            // 当前卡逐渐后退
            translateZ = 0 - 150 * swipeProgress;
          } else if (index === currentIndex + 1) {
            // 下一张卡逐渐前移
            translateZ = -200 + 250 * swipeProgress; // 起点 -200，终点 +50
          }
        } else if (deltaX > 0) {
          // 向右滑 → 目标卡是 currentIndex - 1
          if (index === currentIndex) {
            translateZ = 0 - 150 * swipeProgress;
          } else if (index === currentIndex - 1) {
            translateZ = -200 + 250 * swipeProgress;
          }
        }
      }

      // ===== Y 轴偏移（补偿缩放中心）=====
      let translateY = 0;

      // ===== 缩放计算=====
      // 滑动时动态缩放当前卡片
      let scale = 1;
      if (this.data.isSwiping && index === currentIndex) {
        // 根据滑动距离计算缩放比例
        const swipeProgress = Math.abs(deltaX) / 200; // 滑动200px为完整过程
        const scaleAmount = Math.min(swipeProgress * 0.2, 0.2); // 最多缩小20%
        scale = 1 - scaleAmount;

        // 调整 translateY 以保持视觉中心在 center center
        // 当 transform-origin 是 bottom center 时，缩放会让卡片向下收缩
        // 需要向上移动 (负的 translateY) 来补偿，使视觉效果像从中心缩放
        translateY = -(1 - scale) * cardHeight * translateYCompFactor; // 向上补偿，保持视觉中心
      } else if (this.data.isSwiping) {
        // 让目标卡轻微缩小，抵消 translateZ 带来的视觉放大
        const swipeProgress = Math.min(Math.abs(deltaX) / swapDistance, 1);

        const isNextTarget = deltaX < 0 && index === currentIndex + 1;
        const isPrevTarget = deltaX > 0 && index === currentIndex - 1;

        if (isNextTarget || isPrevTarget) {
          // 初始即缩小 3%，随滑动最多到 18%，抵消前移放大
          const scaleAmount = Math.min(0.03 + swipeProgress * 0.15, 0.18);
          scale = 1 - scaleAmount;

          // 缩小时向上补偿，避免底部缩放导致的视觉下坠
          translateY = -(1 - scale) * cardHeight * translateYCompFactor;
        }
      }

      // Z-index（滑动时动态调整）
      let zIndex = 100 - absProgress;

      // 如果是即将显示的下一张卡片，提升其 z-index（先判断，优先级更高）
      if (this.data.isSwiping) {
        const threshold = 80;
        if (deltaX < -threshold && index === currentIndex + 1) {
          // 向左翻，下一张（右侧）卡片提升
          zIndex = 101;
        } else if (deltaX > threshold && index === currentIndex - 1) {
          // 向右翻，上一张（左侧）卡片提升
          zIndex = 101;
        }
      }

      // 当滑动超过阈值时，降低当前卡片的 z-index
      if (this.data.isSwiping && index === currentIndex) {
        const threshold = 80;
        if (Math.abs(deltaX) > threshold) {
          // 即将翻页，降低当前卡片的 z-index
          zIndex = 50;
        }
      }

      // 阴影
      const shadowOpacity = Math.min(absProgress * 0.3, 0.5);

      // 组合变换
      const transform = `
        translate3d(${translateX}rpx, ${translateY}rpx, ${translateZ}rpx)
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
