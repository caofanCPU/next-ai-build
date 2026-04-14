# AI Chat UI

## 目标

本文档是当前仓库 AI Chat 页面交互与布局设计的唯一 UI 文档。

目标不是复刻 Grok 的视觉风格，而是抽取它在聊天主区域上的高质量交互结构，并与当前代码实现保持一致。

本文档只讨论：

- 页面骨架
- 响应式布局
- 历史面板交互
- 消息区布局
- 输入区结构
- 聊天页可扩展的 UI 留位

不讨论：

- 后端逻辑
- 请求协议
- provider 调用
- 错误标准化策略

这些见 [ai-chat-architecture.skills.md](/Users/funeye/IdeaProjects/next-ai-build/docs/AI/ai-chat-architecture.skills.md)。

---

## 当前设计原则

当前 UI 设计遵守以下原则：

- 聊天主区域必须是页面唯一核心
- 页面结构优先于装饰风格
- Web 与移动端必须分开处理历史面板
- 输入区必须是稳定底座
- 消息布局必须能承接后续多模态与操作按钮
- 调试信息不得继续破坏聊天主轴

---

## 当前页面骨架

当前测试页：

- [ai-runtime-playground.tsx](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/[locale]/(home)/test/ai/ai-runtime-playground.tsx)

当前页面骨架已经调整为：

```tsx
<main>
  <header />

  <div className="chat-body">
    <aside className="desktop-history-panel" />
    <section className="chat-main">
      <div className="chat-main-header" />
      <AIMessageList />
      <AIChatComposer />
    </section>
  </div>

  <div className="mobile-history-drawer" />
</main>
```

这套骨架已经从“调试工作台布局”切换到了“聊天布局”。

---

## 顶部区域

## 职责

顶部只做页面级内容：

- 标题
- 简要说明
- 历史面板开关
- 少量状态信息

不再承载：

- 大块 helper 卡片
- 大段说明文本
- 大面积示例 prompt 区
- 独立并列控制台

## 当前实现

顶部 header 已经是独立容器，并提供：

- Web 端侧栏开关
- 移动端抽屉入口
- 消息数 / 事件数 / streaming 状态

原则：

- 历史入口必须始终在头部可见
- 状态信息可压缩为轻量 badge
- 标题区与操作区左右分离

---

## 历史面板

## Web 端

当前方案：

- 左侧辅助面板
- 可折叠
- 宽度固定
- 内部独立滚动

当前用途：

- 当前 session prompt 列表
- reset 会话入口
- runtime / mock controls

说明：

这不是最终产品级“历史会话系统”，而是当前聊天容器的辅助侧栏。

设计原则：

- 左栏永远是辅助区，不是内容主角
- 宽度固定，不能随内容膨胀
- 不应与消息区争抢阅读空间

建议宽度：

- `280px - 320px`

## 移动端

当前方案：

- 改为底部抽屉
- 从头部按钮或 composer 左按钮进入
- 抽屉独立滚动

设计原则：

- 移动端不使用左侧栏
- 抽屉高度控制在 `60vh - 75vh`
- 保持当前聊天上下文，不跳页

---

## 主聊天区

主聊天区当前已采用标准聊天容器结构：

- 上部可选说明区
- 中部消息滚动区
- 下部固定输入区

关键规则：

- `chat-main` 必须是纵向 `flex`
- `AIMessageList` 所在区域必须 `min-h-0 flex-1 overflow-y-auto`
- `AIChatComposer` 所在区域必须固定在底部，不参与消息滚动

这点是当前 UI 改造的核心成果之一。

---

## 消息列表

当前实现：

- [ai-message-list.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-list.tsx)

当前能力：

- 空态展示
- 自动滚动到底部
- 内部统一阅读宽度
- 自定义 `renderMessage`

设计原则：

- 外层负责滚动
- 内层负责阅读宽度与消息间距
- 宽屏下消息区不能无限展开

当前做法：

- 内层统一 `max-w-5xl`
- 单条消息再额外控制自身最大宽度

结果：

- 超宽屏阅读不松散
- 消息不会铺满整个页面

---

## 单条消息布局

当前实现：

- [ai-message-bubble.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-bubble.tsx)

消息骨架已固定为：

```tsx
<div className="message-row">
  <article className="message-card">
    <div className="message-content" />
    <div className="message-footer">
      <div className="message-meta" />
      <div className="message-actions" />
    </div>
  </article>
</div>
```

## 对齐规则

- 用户消息右对齐
- AI 消息左对齐
- 两边都限制最大宽度

当前默认范围：

- 移动端接近 `max-w-[92%]`
- 桌面端接近 `max-w-[82%]`

这是当前消息布局的基础规则，后续不要回到“全宽消息块”。

## 底部信息与操作区

当前 message footer 已经拆成两部分：

- 左侧 `meta`
- 右侧 `actions`

这解决了之前“状态文本和操作按钮混成一串 badge”的问题。

当前 `meta` 默认包括：

- 时间
- 状态
- assistant runtime 耗时
- failure reason

当前 `actions` 在 playground 中已预留：

- `Copy`
- `Reuse` 或 `Retry`
- `More`

设计原则：

- 提示文本与操作行为必须分区
- 用户消息和 AI 消息保持同一骨架
- 即使暂时没有动作，也应保留 action 区容器

---

## 消息正文渲染

当前实现：

- [ai-message-content.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-content.tsx)
- [ai-markdown.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-markdown.tsx)

当前 text part 已改成 Markdown 渲染。

当前支持：

- 普通段落
- 标题
- 列表
- 引用
- 链接
- 图片
- 基础代码块
- 表格

当前默认图片已复用：

- [image-zoom.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/fuma/mdx/image-zoom.tsx)

UI 层结论：

- 普通 AI 文本已经不再是纯字符串展示
- 现阶段对普通用户已足够可读
- 复杂多模态资源块仍留给独立 `part renderer`

---

## 输入区

当前实现：

- [ai-chat-composer.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-chat-composer.tsx)

当前结构已改为三段式：

```tsx
<div className="composer-shell">
  <div className="composer-left" />
  <div className="composer-center">
    <textarea />
  </div>
  <div className="composer-right" />
</div>
```

并支持：

- 自动增高
- Enter 发送
- Shift + Enter 换行
- Streaming 时显示 Stop
- 左侧 slot
- helper 区
- attachments 预留位

## 当前设计规则

- 输入区必须固定在聊天主区底部
- 默认高度更接近聊天输入器，而不是大块表单
- 左侧预留未来多模态入口
- 中间始终是输入主轴
- 右侧保留发送或停止操作

这套结构已经足够承接未来图片上传、文件引用、模型选择、工具入口，而不用重做布局。

---

## 响应式规则

## Web 端

当前目标：

- 左侧历史面板
- 右侧聊天主区
- 顶部头部独立

关键布局约束：

- `min-w-0`
- `min-h-0`
- `overflow-hidden`

这些约束必须保留，否则消息区和输入区容易把容器撑坏。

## 移动端

当前目标：

- 不显示左侧栏
- 使用底部抽屉承载 session / controls
- 聊天主区全宽
- 输入区贴底

移动端体验原则：

- 历史入口点击路径短
- 输入区不被消息滚动区吞掉
- 消息宽度大，但仍保留必要留白

---

## 当前 Playground 的 UI 定位

当前测试页已经不再是旧式调试面板，而是：

- 一页真实可用的聊天主区域验证页
- 同时保留 runtime / mock 调试入口
- 用于沉淀 `third-ui/ai` 的页面骨架与组件实践

因此它承担的是“双重角色”：

- 验证聊天 UI 积木
- 验证 runtime 通路

后续如果继续演进，建议保持这个原则：

- 调试信息可以存在
- 但只能退到辅助区
- 不能重新抢占聊天主区

---

## 当前可复用的 UI 资产

已经可复用：

- 消息左右对齐骨架
- message footer 的 `meta + actions` 分区
- 消息区自动滚动到底
- 三段式 composer
- Web 侧栏 / 移动端抽屉 的主布局策略
- text part Markdown 渲染

后续继续扩展时，应优先复用这些能力，而不是重新在页面里拼临时 DOM。

---

## 后续 UI 扩展建议

优先级建议：

1. 把聊天可复用的 Markdown component map 收口
2. 完成 `image part` / `file part` 的资源块样式
3. 完善消息级 action 设计
4. 补齐 session 面板的数据来源与状态记忆

当前不建议优先做：

- 复杂皮肤化
- 过重的装饰性样式
- 类文档站级别的复杂代码块增强
- 完整 Grok 历史系统复刻

---

## 文档约束

后续任何涉及聊天主布局、消息布局、输入交互、响应式方案的改动，优先更新本文档。

若代码与本文档冲突，以当前代码为准，并立即同步修正文档。
