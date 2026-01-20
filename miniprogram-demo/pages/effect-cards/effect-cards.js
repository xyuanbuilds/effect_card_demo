/**
 * 小程序版 EffectCards 实现
 * 基于 Swiper EffectCards 原理，使用小程序语法重写
 */

Page({
  data: {
    cards: [
      { id: '1', cardContent: '卡片 1', backgroundColor: '#667eea' },
      { id: '2', cardContent: '卡片 2', backgroundColor: '#764ba2' },
      { id: '3', cardContent: '卡片 3', backgroundColor: '#f093fb' },
      { id: '4', cardContent: '卡片 4', backgroundColor: '#4facfe' },
    ],
    currentIndex: 0,

    // 配置参数（参考 Swiper EffectCards）
    perSlideOffset: 8,    // 每张卡片偏移量（rpx）
    perSlideRotate: 2,    // 每张卡片旋转角度（度）
    maxVisibleCards: 3,   // 最多可见卡片数

    // 触摸相关
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
   * 计算并更新所有卡片的样式
   * 核心算法：基于 Swiper EffectCards 的 setTranslate 逻辑
   */
  updateCardsStyle(deltaX = 0, deltaY = 0) {
    const { currentIndex, perSlideOffset, perSlideRotate, maxVisibleCards, cards } = this.data;
    const updatedCards = cards.map((card, index) => {
      // 计算每张卡片的 progress（相对于当前卡片的位置）
      const progress = index - currentIndex;

      // 只处理可见范围内的卡片
      if (Math.abs(progress) > maxVisibleCards) {
        return {
          ...card,
          style: 'opacity: 0; z-index: -1;',
          shadowStyle: 'opacity: 0;'
        };
      }

      // 计算 3D 变换参数（参考 Swiper 源码）
      const absProgress = Math.abs(progress);

      // Z 轴深度（创建层叠效果）
      const translateZ = -100 * absProgress;

      // 旋转角度
      let rotate = -perSlideRotate * progress;

      // 如果正在滑动，根据滑动距离增强旋转
      if (this.data.isSwiping && index === currentIndex) {
        const swipeRotate = (deltaX / 10) * 0.5; // 根据滑动距离增加旋转
        rotate += swipeRotate;
      }

      // X 轴偏移量
      const offsetAdd = perSlideOffset - absProgress * 0.75;
      let translateX = progress > 0 ? offsetAdd * absProgress : -offsetAdd * absProgress;

      // 滑动时的额外偏移
      if (this.data.isSwiping && index === currentIndex) {
        translateX += deltaX * 0.5;
      }

      // 缩放（越往后越小）
      const scale = 1 - absProgress * 0.1;

      // z-index 层级
      const zIndex = 100 - Math.abs(Math.round(progress));

      // 组合 transform
      const transform = `
        translate3d(${translateX}rpx, 0, ${translateZ}rpx)
        rotateZ(${rotate}deg)
        scale(${scale})
      `;

      // 阴影透明度（根据深度变化）
      const shadowOpacity = Math.min(absProgress * 0.3, 0.5);

      return {
        ...card,
        style: `
          transform: ${transform};
          z-index: ${zIndex};
          opacity: ${absProgress > maxVisibleCards ? 0 : 1};
        `,
        shadowStyle: `opacity: ${shadowOpacity};`
      };
    });

    this.setData({
      cards: updatedCards
    });
  },

  /**
   * 触摸开始
   */
  onTouchStart(e) {
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.pageX,
      touchStartY: touch.pageY,
      touchMoveX: 0,
      touchMoveY: 0,
      isSwiping: true
    });
  },

  /**
   * 触摸移动
   */
  onTouchMove(e) {
    const touch = e.touches[0];
    const { touchStartX, touchStartY } = this.data;

    const deltaX = touch.pageX - touchStartX;
    const deltaY = touch.pageY - touchStartY;

    this.setData({
      touchMoveX: deltaX,
      touchMoveY: deltaY
    });

    // 实时更新卡片样式（带滑动效果）
    this.updateCardsStyle(deltaX, deltaY);
  },

  /**
   * 触摸结束
   */
  onTouchEnd(e) {
    const { touchMoveX, currentIndex, cards } = this.data;
    const threshold = 100; // 滑动阈值（px）

    let newIndex = currentIndex;

    // 向左滑动（下一张）
    if (touchMoveX < -threshold && currentIndex < cards.length - 1) {
      newIndex = currentIndex + 1;
      this.animateCardOut('left');
    }
    // 向右滑动（上一张）
    else if (touchMoveX > threshold && currentIndex > 0) {
      newIndex = currentIndex - 1;
      this.animateCardOut('right');
    }

    this.setData({
      currentIndex: newIndex,
      isSwiping: false,
      touchMoveX: 0,
      touchMoveY: 0
    }, () => {
      this.updateCardsStyle();
    });
  },

  /**
   * 卡片飞出动画
   */
  animateCardOut(direction) {
    // 可以在这里添加卡片飞出的动画效果
    wx.vibrateShort({ type: 'light' }); // 震动反馈
  },

  /**
   * 手动切换到指定卡片（可选功能）
   */
  switchToCard(index) {
    if (index >= 0 && index < this.data.cards.length) {
      this.setData({
        currentIndex: index
      }, () => {
        this.updateCardsStyle();
      });
    }
  }
});
