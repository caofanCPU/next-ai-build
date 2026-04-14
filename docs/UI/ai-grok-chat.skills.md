# AI Grok Chat UI

## 目标

本文档记录当前 `test/ai` 页面已经落地的 Grok 风格聊天 UI 实现结果。

目标不是复刻 Grok 的视觉皮肤，而是沉淀一套适合通用 `ai-chat` 组件的页面级聊天布局与交互结构。本文档只讨论前端 UI 结构、交互和组件留位，不讨论后端协议、数据流和服务实现。

当前测试页：

- [ai-runtime-playground.tsx](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/[locale]/(home)/test/ai/ai-runtime-playground.tsx)

底层核心组件：

- [ai-chat-composer.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-chat-composer.tsx)
- [ai-message-list.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-list.tsx)
- [ai-message-bubble.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-bubble.tsx)

## 当前已实现

### 页面级骨架

当前测试页已经实现为标准聊天页骨架：

- 顶部是聊天主区域头部，不再保留调试工作台式大卡片
- Web 端为左侧辅助面板 + 右侧主聊天区
- 主聊天区使用固定高度容器
- 消息列表区域独立垂直滚动
- 输入框区域固定在底部，不跟随消息滚动

这意味着聊天消息再长，也不会继续把整个页面无限向下撑开。

### 顶部头部

当前主聊天区头部为三列结构：

- 左侧：侧边面板折叠按钮
- 中间：`Conversation` 标题 + `InfoTooltip`
- 右侧：保留未来扩展位

当前头部已经不再承担说明卡片、示例提示词区等杂项内容，只负责聊天主区域本身的顶层操作。

### 左侧面板

当前左侧面板已实现两种内容视图切换：

- `Runtime Config`
- `Recent sessions`

当前交互规则：

- Web 端左侧面板可折叠
- 移动端改为底部抽屉
- 面板内部独立滚动
- footer 固定两个操作图标
- `Settings2` 用于切换面板内容
- `HousePlus` 用于创建新会话

### Session 列表

当前 session 列表已经从占位数据改为真实测试数据驱动，具备以下行为：

- 新建会话时立即创建 `New Chat`
- 首条用户消息会自动覆盖默认标题
- 支持手动编辑标题
- 支持置顶 / 取消置顶
- 支持删除 session
- 支持按更新时间排序
- 置顶项始终排在前面
- 当前选中 session 使用背景色区分，而不是边框线

当前 session item 已优化为两段式交互：

- 第一行：置顶标记 + 标题 + 展开按钮
- 第二行：展开后显示编辑、置顶、删除操作按钮

### 主消息区

当前消息区已经实现 Grok 风格的主轴布局：

- 用户消息右对齐
- AI 消息左对齐
- 消息宽度有上限，不会铺满整行
- 聊天气泡具有最小宽高，短文本不会塌陷变形
- 主阅读区在宽屏下仍保持可读性，不会过宽

当前测试页对单条消息做了二层结构拆分：

- 第一层：消息内容气泡
- 第二层：气泡外部紧贴的元数据区

元数据区当前规则：

- 只有最近一条消息默认显示
- 其他消息默认占位但隐藏
- 鼠标悬浮消息时显示
- 元数据与气泡物理分离，不再放入气泡内部

### 消息操作区

当前 playground 中，UM 和 AM 都已经预留并接入了操作按钮。

用户消息当前支持：

- 复制
- Reuse 到输入框
- 删除

AI 消息当前支持：

- 复制
- Retry
- 删除

删除操作已经接入确认弹窗。

### AI 状态反馈

当前 AI 消息状态反馈已做基础收口：

- 首 token 到达前显示 `AI is thinking`
- 空响应时使用兜底文案，而不是空白消息
- `Send` 按钮在生成中切换为 `CircleStop`
- 停止按钮带轻量旋转动画
- AM 状态标签根据状态做了颜色区分

### Markdown 文本消息

当前文本消息已经从纯文本展示升级为 Markdown 渲染，适用于 AI 返回 Markdown 格式文本的场景。

当前可覆盖的内容包括：

- 标题
- 段落
- 列表
- 行内代码
- 代码块基础展示
- 图片链接
- 已注册的自定义 Markdown 组件协议内容

这意味着当前聊天框已经具备承接结构化文本响应的基础能力。

### 输入框

当前输入框已经实现为通用 composer 结构，并支持两种动作布局模式：

- `inline`
- `stacked`

#### Inline 模式

适用于没有额外功能按钮，或者只有少量辅助按钮的场景。

当前行为：

- 输入框默认单行
- 发送按钮与输入内容最后一行对齐
- `Settings2` 按钮与发送按钮一起放在右侧
- 内容变多时自动增高
- 超过最大高度才出现内部滚动条

#### Stacked 模式

适用于输入框下方需要预留工具按钮区的场景。

当前行为：

- 输入区在上
- 下方单独一行动作区
- 左侧是扩展功能按钮位
- 右侧是模式切换按钮
- 最右侧是发送或停止按钮

当前测试页的 stacked 模式示例：

- 左侧：`BrushCleaning`
- 右侧：`Settings2`
- 最右：`Send` / `Stop`

#### 输入交互

当前输入交互规则：

- `Enter` 发送
- `Shift + Enter` 换行
- 自动聚焦与光标回到末尾已接入
- 切换 `inline / stacked` 布局时会重新计算输入框高度
- 初始状态为单行，不再默认两行

## 当前实现对应的 UI 结论

基于当前代码，`test/ai` 页面已经不是“功能测试页拼装界面”，而是一个接近可复用产品形态的 Grok 风格聊天容器原型。

它已经具备：

- 页面级聊天骨架
- 可折叠侧栏
- session 列表交互
- 消息滚动容器
- 左右对齐消息布局
- 气泡外元数据区
- 用户 / AI 消息操作按钮预留
- Markdown 文本消息展示
- 双模式输入框结构

这套实现已经可以作为后续通用 `ai-chat` UI 积木块的主要参考实现。

## 组件落点

当前页面级实现主要落在：

- [ai-runtime-playground.tsx](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/[locale]/(home)/test/ai/ai-runtime-playground.tsx)

当前输入框通用能力主要落在：

- [ai-chat-composer.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-chat-composer.tsx)

当前消息渲染相关能力主要落在：

- [ai-message-list.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-list.tsx)
- [ai-message-bubble.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-bubble.tsx)
- [ai-message-meta.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-meta.tsx)
- [ai-status-indicator.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-status-indicator.tsx)

## 待办清单

- 重点补强移动端兼容设计，包括抽屉交互、输入法遮挡、底部安全区、窄屏消息密度和手势体验
- 将当前测试页中已经验证通过的 session 面板与聊天主区结构，继续下沉为更标准的通用组件 API
- 进一步梳理 composer 的动作区协议，明确哪些是左侧工具按钮，哪些是右侧辅助按钮，哪些属于主提交动作
- 完善移动端下消息元数据 hover 语义的替代交互，因为触屏环境不存在 hover
- 补强 session 列表在极端数据量下的体验，例如长标题、超多会话、滚动定位与性能
- 把当前测试页中的 session 操作按钮和确认交互进一步沉淀为更可复用的 UI 模式
- 补充更完整的空态、异常态和断流态视觉规则
- 后续接入多模态消息时，为图片、文件、音频、视频等内容设计独立消息块布局，而不是继续塞入纯文本气泡
