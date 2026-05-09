# Border Frame 动画方案

本文沉淀 `BorderBeam` 替换方案。目标是做一个主题感更强、性能更稳、API 更克制的边框光束组件，而不是原样复刻 `border-beam` 包。


## BeamFrame 当前工作总结

## 最高优先级问题

当前 `AnimeBeamFrame` 的速度切换仍然有问题。虽然代码里已经尝试把 Anime WAAPI 动画改成固定基准时长 `BASE_DURATION_SECONDS = 1.8`，再通过 `playbackRate = BASE_DURATION_SECONDS / duration` 来切换 Fast / Mid / Slow，但实测问题仍存在。后续应优先重新研究 `animejs` 的 `waapi.animate` 返回对象，确认它是否真正支持直接写入 `playbackRate`，或者是否需要访问底层 `Animation` 实例 / 重建动画并保留当前进度。

当前不要把 Anime 版当成稳定实现。生产默认仍应使用 `MotionBeamFrame`，Anime 版只作为测试页对照和 WAAPI 实验入口。

## 已完成内容

- 新增 `BeamFrame` 底层组件，并通过 `@third-ui/main/beam-frame` 导出。
- 保留 `apps/ddaas/src/app/[locale]/(home)/test/ana/page.tsx` 作为旧 `border-beam` 对照页，不再改动。
- 新增 `apps/ddaas/src/app/[locale]/(home)/test/border-frame/page.tsx` 测试页。
- 测试页上下两张独立卡片展示 `MotionBeamFrame` 和 `AnimeBeamFrame`。
- 测试页覆盖三个常见包裹场景：外层内容卡片、搜索输入框、右侧 Up 图标按钮。
- 移除了 `shape` 概念，动画统一为 around 边框环绕形式。
- 移除了倒计时闹钟、Interactive 开关、Around / Bottom 选项。
- 播放控制改为初始不渲染动画，点击 `MonitorPlayIcon` 开始，点击 `CirclePauseIcon` 暂停。
- Motion 版暂停已经能保留当前动画帧，不会清空样式。
- Anime 版暂停曾出现回到初始状态的问题，已改为调用 `pause()` 而不是清空 `strokeDashoffset`，但速度切换问题仍未解决。

## 当前实现方向

`BeamFrame` 是动画壳组件，只允许影响被包裹内容的边框动画，不应该改变内容区域背景色。内容本身的背景、边框和布局由 children 自己负责。

当前实现使用真实测量尺寸的 SVG rounded rect：

- `ResizeObserver` 测量 wrapper 宽高。
- `viewBox` 使用真实宽高。
- `rect` 的 `rx / ry` 根据传入 `radius` 和实际尺寸 clamp。
- 动画通过 `strokeDasharray` + `strokeDashoffset` 沿真实 rounded rect 轨道运行。

这样做的目标是避免之前出现的错误：亮色主题下动画围绕中心点旋转、线条过粗、没有贴合被包裹组件边框形状。

## 视觉层结构

当前 `BeamFrame` 有三层：

```txt
root wrapper
  static base border ring
  animated svg beam layer
  content layer
```

动画层目前是两条同轨 SVG stroke：

- `halo`：较宽、低透明度、彩色光圈范围。
- `beam`：主边框光束，覆盖静态边框线。

曾经尝试增加一条白色短 `spark` 来模拟运动点，但实测看起来像一段白色粗线，视觉效果较差，已经移除。

## 性能原则

旧 `border-beam` 的炫彩效果不只是边框线，还包含一圈运动点和光圈范围；但旧包主要依赖多层 `radial-gradient`、`mask`、`filter: blur()`、`hue-rotate` 和多个无限 CSS keyframes。这个方案视觉丰富，但在长期无限动画场景下有明显性能风险。

新 `BeamFrame` 不能照搬旧包。当前约束是：

- 不在内容区域叠加背景色。
- 不使用大面积动态渐变背景。
- 不使用 `filter: blur()` / `hue-rotate`。
- 不动画化复杂 mask。
- 优先使用 SVG stroke 的 `strokeDashoffset`。
- 光圈只能是轻量 SVG stroke，不做全卡片 bloom 重绘。

## API 当前状态

```ts
type BeamFrameProps = {
  children: React.ReactNode;
  active?: boolean;
  interactive?: boolean;
  intensity?: 'subtle' | 'regular' | 'strong';
  tone?: 'theme' | 'rainbow' | 'mono' | 'warm' | 'cool';
  duration?: number;
  radius?: number;
  className?: string;
};
```

默认导出策略：

```ts
export function MotionBeamFrame(props: BeamFrameProps) {}
export function AnimeBeamFrame(props: BeamFrameProps) {}
export const BeamFrame = MotionBeamFrame;
```

## 后续待处理

1. 优先修复 `AnimeBeamFrame` 速度切换。
2. 继续调校 `halo`，目标是像旧 `border-beam` 一样有运动点附近的光圈范围，但不能变成白色粗线，也不能污染内容背景。
3. 对比亮色 / 暗色主题，确保主光束能覆盖静态边框线，且亮色主题下不会像圆周绕中心运动。
4. 确认 `subtle / regular / strong` 的差异主要体现在线宽、光圈宽度、光束长度和透明度，而不是改变内容背景。




## 背景

当前 `border-beam` 的主要问题不是“无限动画”本身，而是动画内容过重：

- 多层 `radial-gradient` / `conic-gradient`
- `mask` / `-webkit-mask`
- `filter: blur()` / `brightness()` / `saturate()`
- `hue-rotate`
- 多个无限 CSS keyframes 同时运行

尤其 `colorVariant="colorful"` 时，光效层会持续重绘复杂渐变。测试页通过限制播放时长绕开问题，但这不是底层组件的长期方案。

新组件应保留视觉目标：**沿边框轨道运动的高亮光束**。不要只做普通的 animated gradient border。

## 概念区分

`gradient-border-plugin` 一类方案主要解决的是“渐变边框线”：

- 整条边框都有渐变
- 动画通常是旋转渐变角度
- 视觉重点是边框材质变化

`border-beam` 的核心是“沿边框运动的光束”：

- 不是整圈边框同等发光
- 有局部高亮光束沿路径移动
- 视觉重点是 traveling beam / moving highlight

因此新组件应采用：

```txt
静态主题渐变边框 + 沿边框移动的局部光束
```

渐变边框的经验可以吸收，但不能用“整圈渐变旋转”冒充 beam。

## 技术原则

动画层只做便宜属性：

- `transform`
- `opacity`

避免动画化：

- gradient stop
- CSS 自定义角度变量
- `filter`
- `hue-rotate`
- 复杂 mask
- 大面积 blur

这意味着 Motion / Anime 无限播放并不是问题。只要动画内容是合成层 transform，性能模型和原 `border-beam` 完全不同。

## 推荐实现

组件分两套实现，API 保持一致：

```ts
export function MotionBeamFrame(props: BeamFrameProps) {}
export function AnimeBeamFrame(props: BeamFrameProps) {}
export const BeamFrame = MotionBeamFrame;
```

推荐生产默认使用 Motion：

- React 状态绑定更自然
- hover / focus / active 更容易表达
- 更适合后续统一动画组件体系

Anime 版保留为对照和实验：

- 适合验证 WAAPI 性能
- 适合后续复杂 timeline 或非 React DOM 动画
- 不作为普通 React UI 的默认实现

## API

最终 API 应保持克制：

```ts
type BeamFrameProps = {
  children: React.ReactNode;

  active?: boolean;
  interactive?: boolean;

  shape?: 'around' | 'bottom';
  intensity?: 'subtle' | 'regular' | 'strong';
  tone?: 'theme' | 'rainbow' | 'mono' | 'warm' | 'cool';

  duration?: number;
  radius?: number;

  className?: string;
};
```

默认值建议：

```ts
{
  active: false,
  interactive: true,
  shape: 'around',
  intensity: 'regular',
  tone: 'theme',
  duration: 1.8,
}
```

### 字段说明

`children`

实际内容，比如按钮、输入框、卡片。`BeamFrame` 只做装饰，不处理按钮语义、点击、loading、href。

`active`

外部控制是否播放。适合生成中、输入聚焦、测试页重放、首页唯一主 CTA。

`interactive`

是否在 hover / focus-within 时自动播放。默认开启。它主要控制视觉噪音，不是性能兜底。

`shape`

光束路径：

- `around`：光束沿完整边框轨道运动
- `bottom`：光束沿底部边线扫过

不要使用 `sm` / `md` / `line`。这些名字混淆了尺寸、路径和强度。组件尺寸应由 `children` 和 `className` 决定。

`intensity`

视觉强度：

- `subtle`：轻提示
- `regular`：默认
- `strong`：页面唯一高强调入口

它控制边框透明度、光束长度、bloom 强弱，而不是组件大小。

`tone`

颜色风格：

- `theme`：默认，跟随网站主题色
- `rainbow`：最高强调
- `mono`：克制灰白
- `warm`：暖色 CTA
- `cool`：AI / 工具类冷色

`duration`

一轮动画时长，单位秒。只控制速度。

`radius`

外壳圆角。重要场景建议显式传入，避免自动读取子元素样式带来的不确定性。

`className`

加在外层 wrapper，用于控制宽度和布局。

## 主题色策略

组件默认 `tone="theme"`，应接入 `packages/base-ui/src/lib/theme-util.ts` 的主题系统。

当前网站主题色：

```txt
purple  #AC62FD
orange  #F97316
indigo  #6366F1
emerald #10B981
rose    #F43F5E
```

建议内部维护主题派生 palette：

```txt
purple:  #AC62FD -> #EC4899 -> #6366F1
orange:  #F97316 -> #F59E0B -> #EF4444
indigo:  #6366F1 -> #3B82F6 -> #06B6D4
emerald: #10B981 -> #14B8A6 -> #22C55E
rose:    #F43F5E -> #EC4899 -> #FB7185
```

亮暗主题不暴露 prop。组件内部根据 CSS / dark class 自动降低或增强透明度：

- 浅色：降低 bloom，避免脏边
- 深色：提高 glow，保留高光

## 视觉结构

建议分三层：

```txt
root
  base border layer
  beam layer
  content layer
```

`base border layer`

- 静态主题渐变边框
- 低透明度
- 给组件提供稳定质感

`beam layer`

- 局部高亮光束
- 只通过 `transform` 移动
- `around` 使用局部亮段的 conic layer 旋转
- `bottom` 使用局部光斑水平扫过

`content layer`

- 包裹真实 children
- 保持 pointer / aria / button 语义由 children 自己负责

## Motion 版

Motion 版用 `motion.div` 控制光束层：

```tsx
<motion.div
  animate={isRunning ? { rotate: 360 } : { rotate: 0 }}
  transition={{ duration, repeat: Infinity, ease: 'linear' }}
/>
```

`bottom` 形态可以使用 `x` 位移：

```tsx
<motion.div
  animate={isRunning ? { x: ['-30%', '130%'] } : { x: '-30%' }}
  transition={{ duration, repeat: Infinity, ease: 'linear' }}
/>
```

注意：不要用 Motion 每帧改 gradient 参数。

## Anime 版

Anime 版通过 ref 控制同样的 transform 动画。

适合使用 Anime v4 的 WAAPI 能力：

```ts
waapi.animate(node, {
  rotate: '1turn',
  loop: true,
  duration: duration * 1000,
  ease: 'linear',
});
```

注意：

- 需要处理 mount / unmount 销毁
- 需要处理 active 切换
- 需要处理 hover / focus-within 状态
- 不作为生产默认组件

## 无障碍与降级

必须尊重 `prefers-reduced-motion`：

- 默认显示静态边框
- 不播放无限动画
- 不需要暴露 `reducedMotion` prop

装饰层必须：

```css
pointer-events: none;
```

内部交互元素继续负责自身语义。

## 使用原则

`BeamFrame` 是高强调装饰壳，不是默认按钮样式。

适用：

- 首页唯一 CTA
- AI 生成主操作
- prompt input 聚焦态
- 空状态关键引导
- 展示页或测试页

不适用：

- 表格行内操作
- 普通后台按钮
- 弹窗 footer
- 危险操作
- 工具栏 icon 批量装饰
- 多个并排按钮同时常驻发光

原则：

```txt
好页面不会到处都是发光区块。
组件技术上可以无限播放，但产品上应克制使用。
```

## 测试页建议

测试页可展示：

- Motion vs Anime
- `shape: around / bottom`
- `tone: theme / rainbow / mono / warm / cool`
- `intensity: subtle / regular / strong`
- `duration`
- `active / interactive`

不要继续暴露过多底层参数，比如：

- brightness
- saturation
- hueRange
- strength slider
- staticColors
- theme prop
- onActivate / onDeactivate

这些会把组件变成调参面板，破坏设计一致性。

## 当前决策

1. 停止把 `border-beam` 作为长期生产依赖。
2. 在 `@windrun-huaiin/third-ui` 中实现自有 `BeamFrame`。
3. `BeamFrame` 默认指向 `MotionBeamFrame`。
4. `AnimeBeamFrame` 作为实验和对照。
5. 默认 `tone="theme"`，跟随网站主题色。
6. 只动画 transform / opacity。
7. 不靠限制动画时长解决性能问题。
