App({
  onLaunch(options) {
    // 小程序初始化
    console.log('App Launch', options);
  },
  onShow(options) {
    // 小程序显示
    console.log('App Show', options);
  },
  onHide() {
    // 小程序隐藏
    console.log('App Hide');
  },
  globalData: {
    // 全局数据
  }
});
