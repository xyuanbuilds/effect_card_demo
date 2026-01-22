Page({
  data: {
    overlayVisible: false,
    overlayClosing: false,
    cardFlipping: false,
    zOffset: 0,
    flipDelay: 500 // 翻卡延迟时间（毫秒），可配置
  },

  flipTimer: null,
  closeTimer: null,
  touchStartY: 0,

  /**
   * 显示浮层
   */
  showOverlay() {
    // 清除可能存在的关闭定时器
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
      this.closeTimer = null
    }

    this.setData({
      overlayVisible: true,
      overlayClosing: false,
      cardFlipping: false,
      zOffset: 0
    })

    // 延迟触发翻卡动画
    this.flipTimer = setTimeout(() => {
      this.setData({
        cardFlipping: true
      })
    }, this.data.flipDelay)
  },

  /**
   * 隐藏浮层
   */
  hideOverlay() {
    // 清除翻卡定时器
    if (this.flipTimer) {
      clearTimeout(this.flipTimer)
      this.flipTimer = null
    }

    // 先设置关闭状态，触发渐隐动画
    this.setData({
      overlayClosing: true,
      cardFlipping: false,
      zOffset: 0
    })

    // 等待动画完成后再真正隐藏（动画时长300ms）
    this.closeTimer = setTimeout(() => {
      this.setData({
        overlayVisible: false,
        overlayClosing: false
      })
      this.closeTimer = null
    }, 300)
  },

  /**
   * 手势开始事件 - 记录初始位置
   */
  onTouchStart(e) {
    const touch = e.touches[0]
    this.touchStartY = touch.clientY
  },

  /**
   * 手势移动事件 - Z轴浮沉
   */
  onTouchMove(e) {
    const touch = e.touches[0]

    // 计算Y轴移动距离
    const deltaY = touch.clientY - this.touchStartY

    // 映射到Z轴偏移（-200 到 200 px 范围，效果更明显）
    const zOffset = Math.max(-200, Math.min(200, deltaY * 0.8))

    this.setData({
      zOffset: zOffset
    })
  },

  /**
   * 手势结束事件 - 恢复Z轴位置
   */
  onTouchEnd() {
    this.setData({
      zOffset: 0
    })
  },

  /**
   * 浮层内容点击事件（阻止冒泡已在 wxml 中使用 catchtap 处理）
   */
  onContentTap(e) {
    // 记录触摸起始位置
    if (e.touches && e.touches.length > 0) {
      this.touchStartY = e.touches[0].clientY
    }
  }
})
