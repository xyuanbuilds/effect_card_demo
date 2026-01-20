# 小程序版 EffectCards 实现

基于 Swiper EffectCards 原理，使用微信小程序语法实现的卡片堆叠效果。

## 快速开始

### 方式一：使用微信开发者工具

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `miniprogram-demo` 文件夹
4. 填写 AppID（可使用测试号）
5. 点击"导入"

### 方式二：集成到现有项目

只需复制需要的页面文件夹到你的项目中：
- `pages/effect-cards/` - 基础版
- `pages/effect-cards-advanced/` - 增强版

然后在 `app.json` 中注册页面即可。

## 项目结构

```
miniprogram-demo/
├── pages/
│   ├── index/                    # 首页（Demo 列表）
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   ├── index.js
│   │   └── index.json
│   ├── effect-cards/             # 基础版 EffectCards
│   │   ├── effect-cards.wxml     # 页面结构
│   │   ├── effect-cards.wxss     # 样式
│   │   ├── effect-cards.js       # 逻辑（核心实现）
│   │   └── effect-cards.json     # 配置
│   └── effect-cards-advanced/    # 增强版 EffectCards
│       ├── effect-cards-advanced.wxml
│       ├── effect-cards-advanced.wxss
│       ├── effect-cards-advanced.js
│       └── effect-cards-advanced.json
├── app.json                      # 全局配置
├── sitemap.json                  # 站点地图
└── README.md                     # 说明文档
```

## 两个版本对比

### 基础版 (effect-cards)
- ✅ 核心卡片堆叠效果
- ✅ 手势滑动切换
- ✅ 简洁的代码结构
- ✅ 适合快速集成

### 增强版 (effect-cards-advanced)
- ✅ 所有基础版功能
- ✅ 实时参数调整（偏移量、旋转角度）
- ✅ 更丰富的卡片内容
- ✅ 操作按钮（上一张、下一张、重置）
- ✅ 指示器点
- ✅ 更完善的交互反馈

## 小程序版 EffectCards 实现

## 核心原理

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

- `touchstart`: 记录初始触摸位置
- `touchmove`: 实时计算滑动距离，更新卡片变换
- `touchend`: 判断滑动方向和距离，决定是否切换卡片

## 文件结构

```
miniprogram-demo/
└── pages/
    └── effect-cards/
        ├── effect-cards.wxml   # 页面结构
        ├── effect-cards.wxss   # 样式文件
        ├── effect-cards.js     # 逻辑控制
        └── effect-cards.json   # 页面配置
```

## 配置参数

```javascript
{
  perSlideOffset: 8,      // 每张卡片偏移量（rpx）
  perSlideRotate: 2,      // 每张卡片旋转角度（度）
  maxVisibleCards: 3,     // 最多可见卡片数
}
```

## 使用方法

### 1. 复制文件到你的小程序项目

将 `pages/effect-cards` 文件夹复制到你的小程序 `pages` 目录下。

### 2. 在 app.json 中注册页面

```json
{
  "pages": [
    "pages/effect-cards/effect-cards"
  ]
}
```

### 3. 自定义卡片数据

修改 `effect-cards.js` 中的 `cards` 数据：

```javascript
data: {
  cards: [
    { id: '1', cardContent: '你的内容', backgroundColor: '#667eea' },
    { id: '2', cardContent: '你的内容', backgroundColor: '#764ba2' },
    // 添加更多卡片...
  ]
}
```

### 4. 调整样式

修改 `effect-cards.wxss` 中的 `.card-content` 样式来自定义卡片外观。

## 特性

- ✅ 3D 透视效果
- ✅ 卡片层叠显示
- ✅ 手势滑动切换
- ✅ 实时跟手反馈
- ✅ 平滑过渡动画
- ✅ 阴影深度效果
- ✅ 可配置参数
- ✅ 震动触觉反馈

## 性能优化建议

1. **限制可见卡片数量**: 通过 `maxVisibleCards` 控制，避免渲染过多卡片
2. **使用 will-change**: CSS 中已添加 `will-change: transform` 优化
3. **防抖处理**: 如需要可以在 `touchmove` 中添加节流

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

在 `wxml` 中添加：

```xml
<view class="indicators">
  <view
    wx:for="{{cards}}"
    wx:key="id"
    class="dot {{index === currentIndex ? 'active' : ''}}"
  ></view>
</view>
```

## 与 Swiper EffectCards 的对比

| 特性 | Swiper EffectCards | 小程序版 |
|------|-------------------|----------|
| 基础效果 | ✅ | ✅ |
| 3D 变换 | ✅ | ✅ |
| 手势控制 | ✅ | ✅ |
| 配置参数 | ✅ | ✅ |
| Loop 模式 | ✅ | 可扩展 |
| 自动播放 | ✅ | 可扩展 |
| 动态加载 | ✅ | ✅ |

## 浏览器兼容性

小程序版本依赖小程序环境的 CSS3 transform 支持，在以下环境测试通过：

- 微信小程序（基础库 2.0+）
- 支付宝小程序
- 抖音小程序
- QQ 小程序

## License

MIT

## 参考资料

- [Swiper EffectCards 源码分析](https://github.com/nolimits4web/swiper/blob/master/src/modules/effect-cards/effect-cards.mjs)
- [小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
