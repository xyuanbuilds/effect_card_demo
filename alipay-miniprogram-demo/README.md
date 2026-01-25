# 支付宝小程序版 EffectCards 实现

基于微信小程序版本转换而来的支付宝小程序实现，保留了所有核心功能和卡片堆叠效果。

## 项目概述

这是一个基于 Swiper EffectCards 原理实现的支付宝小程序 Demo，展示了 3D 卡片堆叠效果和全屏浮层动画。

## 快速开始

### 方式一：使用支付宝开发者工具

1. 打开支付宝开发者工具
2. 选择"导入项目"
3. 选择 `alipay-miniprogram-demo` 文件夹
4. 填写 AppID（可使用测试号）
5. 点击"导入"

### 方式二：集成到现有项目

只需复制需要的页面文件夹到你的项目中：
- `pages/effect-cards-test/` - EffectCards 测试页面
- `pages/overlay-demo/` - 浮层演示页面

然后在 `app.json` 中注册页面即可。

## 项目结构

```
alipay-miniprogram-demo/
├── pages/
│   ├── index/                    # 首页（Demo 列表）
│   │   ├── index.axml
│   │   ├── index.acss
│   │   ├── index.js
│   │   └── index.json
│   ├── effect-cards-test/        # EffectCards 测试页面
│   │   ├── effect-cards-test.axml
│   │   ├── effect-cards-test.acss
│   │   ├── effect-cards-test.js
│   │   └── effect-cards-test.json
│   └── overlay-demo/              # 浮层演示页面
│       ├── overlay-demo.axml
│       ├── overlay-demo.acss
│       ├── overlay-demo.js
│       └── overlay-demo.json
├── app.js                         # 全局应用逻辑
├── app.json                       # 全局配置
├── mini.project.json              # 支付宝开发者工具配置
└── README.md                      # 说明文档
```

## 功能特性

### 1. EffectCards 测试页面
- ✅ 3D 卡片堆叠效果
- ✅ 手势滑动切换
- ✅ 实时参数调整（旋转角度、偏移量）
- ✅ 可见卡片数量控制
- ✅ 卡片尺寸自定义
- ✅ 阴影效果开关
- ✅ 旋转基准点切换（顶部/中心/底部）
- ✅ 快速预设值切换
- ✅ 震动触觉反馈

### 2. 浮层演示页面
- ✅ 全屏浮层显示/隐藏
- ✅ 进入/退出动画
- ✅ 3D 卡片翻转动画
- ✅ 手势控制 Z 轴浮沉效果
- ✅ 点击背景关闭浮层

## 核心技术

### 1. 3D 变换计算

```javascript
// 每张卡片的 progress 值
const progress = index - currentIndex;

// Z 轴深度（创建层叠效果）
const translateZ = -100 * Math.abs(progress);

// 旋转角度（基于 perSlideRotate 配置）
const rotate = -perSlideRotate * progress;

// X 轴偏移量（创建错位效果）
const translateX = progress > 0 ? offsetAdd * absProgress : -offsetAdd * absProgress;

// 缩放（越往后越小）
const scale = 1 - Math.abs(progress) * 0.1;
```

### 2. 核心公式（来自 Swiper 源码分析）

- **深度**: `tZ = -100 * |progress|`
- **偏移**: `offset = 8 - |progress| * 0.75`
- **旋转**: `rotate = -2 * progress + 滑动增强`
- **缩放**: `scale = 1 - |progress| * 0.1`
- **阴影**: `opacity = progress * 0.3`

### 3. 手势处理

- `onTouchStart`: 记录初始触摸位置
- `onTouchMove`: 实时计算滑动距离，更新卡片变换
- `onTouchEnd`: 判断滑动方向和距离，决定是否切换卡片

## 微信小程序 vs 支付宝小程序转换说明

### 主要差异

| 微信小程序 | 支付宝小程序 | 说明 |
|-----------|------------|------|
| `.wxml` | `.axml` | 模板文件扩展名 |
| `.wxss` | `.acss` | 样式文件扩展名 |
| `wx:if` | `a:if` | 条件渲染 |
| `wx:for` | `a:for` | 列表渲染 |
| `wx:key` | `a:key` | 列表项 key |
| `bindtap` | `onTap` | 点击事件绑定 |
| `catchtap` | `catchTap` | 阻止冒泡的点击事件 |
| `bindtouchstart` | `onTouchStart` | 触摸开始事件 |
| `bindtouchmove` | `onTouchMove` | 触摸移动事件 |
| `bindtouchend` | `onTouchEnd` | 触摸结束事件 |
| `bindchange` | `onChange` | 值变化事件 |
| `bindinput` | `onInput` | 输入事件 |
| `bindblur` | `onBlur` | 失焦事件 |
| `wx.vibrateShort()` | `my.vibrateShort()` | 震动反馈 API |
| `wx.setNavigationBarTitle()` | `my.setNavigationBarTitle()` | 设置标题 API |

### 配置文件差异

**微信小程序 app.json:**
```json
{
  "window": {
    "navigationBarTitleText": "标题",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black"
  }
}
```

**支付宝小程序 app.json:**
```json
{
  "window": {
    "defaultTitle": "标题",
    "titleBarColor": "#ffffff"
  }
}
```

### 特别注意事项

1. **Slider 组件**
   - 微信小程序的 `bindchanging` 事件（实时变化）在支付宝小程序中不支持
   - 支付宝小程序只有 `onChange` 事件（松手后触发）
   - 因此实时参数调整的体验略有不同

2. **震动反馈**
   - 支付宝小程序的 `my.vibrateShort()` API 与微信小程序基本一致
   - 都支持 `type` 参数：`light`、`medium`、`heavy`

3. **CSS 兼容性**
   - 两个平台的 CSS 支持基本一致
   - `rpx` 单位、`transform`、`animation` 等都正常支持

## 配置参数

```javascript
{
  perSlideOffset: 10,      // 每张卡片偏移量（rpx）
  perSlideRotate: 10,      // 每张卡片旋转角度（度）
  maxVisibleCards: 3,      // 最多可见卡片数
  transformOrigin: 'center bottom', // 旋转基准点
}
```

## 使用方法

### 1. 自定义卡片数据

修改 `effect-cards-test.js` 中的 `cards` 数据：

```javascript
data: {
  cards: [
    { id: '1', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: '2', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    // 添加更多卡片...
  ]
}
```

### 2. 调整样式

修改 `.acss` 文件中的样式来自定义外观。

### 3. 集成到现有项目

1. 复制页面文件夹到你的项目
2. 在 `app.json` 中注册页面
3. 根据需要修改配置参数

## 性能优化建议

1. **限制可见卡片数量**: 通过 `maxVisibleCards` 控制，避免渲染过多卡片
2. **使用 will-change**: CSS 中已添加 `will-change: transform` 优化
3. **合理使用震动反馈**: 避免过于频繁的震动反馈影响用户体验

## 扩展功能

### 添加自动播放

```javascript
onLoad() {
  this.updateCardsStyle();
  this.startAutoPlay();
},

startAutoPlay() {
  this.timer = setInterval(() => {
    const nextIndex = (this.data.currentIndex + 1) % this.data.cards.length;
    this.switchToCard(nextIndex);
  }, 3000);
},

onUnload() {
  clearInterval(this.timer);
}
```

### 添加指示器

在 `axml` 中添加：

```xml
<view class="indicators">
  <view
    a:for="{{cards}}"
    a:key="id"
    class="dot {{index === currentIndex ? 'active' : ''}}"
  ></view>
</view>
```

## 与 Swiper EffectCards 的对比

| 特性 | Swiper EffectCards | 支付宝小程序版 |
|------|-------------------|--------------|
| 基础效果 | ✅ | ✅ |
| 3D 变换 | ✅ | ✅ |
| 手势控制 | ✅ | ✅ |
| 配置参数 | ✅ | ✅ |
| 实时跟手 | ✅ | ✅ |
| Loop 模式 | ✅ | 可扩展 |
| 自动播放 | ✅ | 可扩展 |
| 动态加载 | ✅ | ✅ |

## 兼容性

支付宝小程序版本依赖小程序环境的 CSS3 transform 支持：

- ✅ 支付宝小程序（基础库 2.0+）
- ✅ 其他类似平台（可能需要少量适配）

## 常见问题

### 1. 为什么滑动条调整没有实时效果？

支付宝小程序的 slider 组件不支持 `onChanging` 事件（实时变化），只有 `onChange` 事件（松手后触发）。这是平台差异导致的。

### 2. 如何修改卡片数量？

在 `effect-cards-test.js` 的 `data.cards` 数组中添加或删除卡片对象即可。

### 3. 如何调整卡片动画效果？

通过修改 `perSlideRotate`（旋转角度）和 `perSlideOffset`（偏移量）参数来调整效果，也可以在页面中实时调整。

## 参考资料

- [Swiper EffectCards 源码分析](https://github.com/nolimits4web/swiper/blob/master/src/modules/effect-cards/effect-cards.mjs)
- [支付宝小程序官方文档](https://opendocs.alipay.com/mini)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## License

MIT

## 相关链接

- [微信小程序版本](../miniprogram-demo/) - 原始微信小程序实现
- [支付宝小程序开发文档](https://opendocs.alipay.com/mini/developer)
