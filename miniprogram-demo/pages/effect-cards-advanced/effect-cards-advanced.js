/**
 * 增强版 EffectCards
 * 包含更多交互功能和配置选项
 */

Page({
  data: {
    cards: [
      {
        id: "1",
        title: "美食推荐",
        description: "发现身边的美味",
        icon: "🍕",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        id: "2",
        title: "旅行计划",
        description: "探索未知的世界",
        icon: "✈️",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        id: "3",
        title: "健身打卡",
        description: "保持健康生活",
        icon: "💪",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        id: "4",
        title: "学习进度",
        description: "每天进步一点点",
        icon: "📚",
        gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      },
      {
        id: "5",
        title: "音乐收藏",
        description: "聆听心灵之声",
        icon: "🎵",
        gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      },
    ],
    currentIndex: 0,

    // 可调节配置
    perSlideOffset: 8,
    perSlideRotate: 2,
    maxVisibleCards: 3,

    // 触摸状态
    touchStartX: 0,
    touchStartY: 0,
    touchMoveX: 0,
    touchMoveY: 0,
    isSwiping: false,
  },

  onLoad() {
    this.updateCardsStyle();
  },

  /**
   * 核心算法：计算并更新所有卡片样式
   * 基于 Swiper EffectCards 的 setTranslate 实现
   */
  updateCardsStyle(deltaX = 0, deltaY = 0) {
    const {
      currentIndex,
      perSlideOffset,
      perSlideRotate,
      maxVisibleCards,
      cards,
    } = this.data;

    const updatedCards = cards.map((card, index) => {
      // 计算 progress（卡片相对于当前卡片的位置）
      // 正值：已翻过的卡片（左侧）
      // 0值：当前卡片
      // 负值：未翻过的卡片（右侧）
      const progress = currentIndex - index;
      const absProgress = Math.abs(progress);

      // 超出可见范围的卡片隐藏
      if (absProgress > maxVisibleCards) {
        return {
          ...card,
          style:
            "opacity: 0; z-index: -1; transform: translate3d(0, 0, -500rpx);",
          shadowStyle: "opacity: 0;",
        };
      }

      // === 3D 变换计算 ===

      // 1. Z 轴深度（创建层叠效果）
      const translateZ = -100 * absProgress;

      // 2. 旋转角度
      let rotate = -perSlideRotate * progress;

      // 滑动时增强旋转效果
      if (this.data.isSwiping && index === currentIndex) {
        const swipeRotate = (deltaX / 10) * 0.5;
        rotate += swipeRotate;
      }

      // 3. X 轴偏移量（创建错位堆叠效果）
      const offsetAdd = perSlideOffset - absProgress * 0.75;
      let translateX = 0;

      if (progress > 0) {
        // 已翻过的卡片向左偏移
        translateX = -offsetAdd * absProgress;
      } else if (progress < 0) {
        // 未翻过的卡片向右偏移
        translateX = offsetAdd * absProgress;
      }

      // 滑动时的跟手效果
      if (this.data.isSwiping && index === currentIndex) {
        translateX += deltaX * 0.5;
      }

      // 4. Y 轴偏移（可选，创建垂直错位）
      let translateY = 0;
      if (this.data.isSwiping && index === currentIndex) {
        translateY = deltaY * 0.3;
      }

      // 5. 缩放效果（只有当前卡片不缩放，其他卡片按深度缩放）
      const scale = progress === 0 ? 1 : 1 - absProgress * 0.1;

      // 6. Z-index 层级
      const zIndex = 100 - absProgress;

      // 7. 不透明度（可选）
      const opacity = absProgress > maxVisibleCards ? 0 : 1;

      // === 组合 Transform ===
      const transform = `
        translate3d(${translateX}rpx, ${translateY}rpx, ${translateZ}rpx)
        rotateZ(${rotate}deg)
        scale(${scale})
      `
        .replace(/\s+/g, " ")
        .trim();

      // === 阴影效果 ===
      const shadowOpacity = Math.min(absProgress * 0.3, 0.5);

      return {
        ...card,
        style: `
          transform: ${transform};
          z-index: ${zIndex};
          opacity: ${opacity};
        `,
        shadowStyle: `opacity: ${shadowOpacity};`,
      };
    });

    this.setData({
      cards: updatedCards,
    });
  },

  /**
   * 触摸事件处理
   */
  onTouchStart(e) {
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.pageX,
      touchStartY: touch.pageY,
      touchMoveX: 0,
      touchMoveY: 0,
      isSwiping: true,
    });
  },

  onTouchMove(e) {
    const touch = e.touches[0];
    const { touchStartX, touchStartY } = this.data;

    const deltaX = touch.pageX - touchStartX;
    const deltaY = touch.pageY - touchStartY;

    this.setData({
      touchMoveX: deltaX,
      touchMoveY: deltaY,
    });

    // 实时更新样式（跟手效果）
    this.updateCardsStyle(deltaX, deltaY);
  },

  onTouchEnd(e) {
    const { touchMoveX, touchMoveY, currentIndex, cards } = this.data;
    const threshold = 80; // 滑动阈值
    const velocityThreshold = 0.5; // 速度阈值（可选）

    let newIndex = currentIndex;

    // 计算滑动距离
    const absX = Math.abs(touchMoveX);
    const absY = Math.abs(touchMoveY);

    // 主要是水平滑动
    if (absX > absY && absX > threshold) {
      // 向左滑（下一张）
      if (touchMoveX < 0 && currentIndex < cards.length - 1) {
        newIndex = currentIndex + 1;
        this.animateCardOut("left");
      }
      // 向右滑（上一张）
      else if (touchMoveX > 0 && currentIndex > 0) {
        newIndex = currentIndex - 1;
        this.animateCardOut("right");
      }
    }

    this.setData(
      {
        currentIndex: newIndex,
        isSwiping: false,
        touchMoveX: 0,
        touchMoveY: 0,
      },
      () => {
        this.updateCardsStyle();
      },
    );
  },

  /**
   * 卡片点击事件
   */
  onCardTap(e) {
    const { index } = e.currentTarget.dataset;
    if (index !== this.data.currentIndex) {
      this.switchToCard(index);
    }
  },

  /**
   * 切换到指定卡片
   */
  switchToCard(e) {
    let index;
    if (typeof e === "number") {
      index = e;
    } else {
      index = parseInt(e.currentTarget.dataset.index);
    }

    if (index >= 0 && index < this.data.cards.length) {
      this.setData(
        {
          currentIndex: index,
        },
        () => {
          this.updateCardsStyle();
          wx.vibrateShort({ type: "light" });
        },
      );
    }
  },

  /**
   * 上一张/下一张
   */
  prevCard() {
    const newIndex = Math.max(0, this.data.currentIndex - 1);
    this.switchToCard(newIndex);
  },

  nextCard() {
    const newIndex = Math.min(
      this.data.cards.length - 1,
      this.data.currentIndex + 1,
    );
    this.switchToCard(newIndex);
  },

  /**
   * 重置到第一张
   */
  resetCards() {
    this.switchToCard(0);
  },

  /**
   * 配置参数调整
   */
  onOffsetChange(e) {
    this.setData(
      {
        perSlideOffset: e.detail.value,
      },
      () => {
        this.updateCardsStyle();
      },
    );
  },

  onRotateChange(e) {
    this.setData(
      {
        perSlideRotate: e.detail.value,
      },
      () => {
        this.updateCardsStyle();
      },
    );
  },

  /**
   * 卡片飞出动画
   */
  animateCardOut(direction) {
    wx.vibrateShort({ type: "light" });

    // 可以在这里添加更复杂的动画效果
    // 例如：粒子效果、翻转动画等
  },
});
