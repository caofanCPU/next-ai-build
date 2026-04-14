# AI Chat Architecture

## 目标

本文档是当前仓库 AI Chat 体系的唯一架构实施文档，覆盖：

- 共享数据协议
- 前后端模块边界
- 请求与流式数据链路
- 错误与状态语义
- 前端会话与消息更新规则
- 当前实现状态与后续扩展方向

本文档不讨论具体 UI 视觉与布局，UI 交互设计单独见 [ai-grok-chat.skills.md](/Users/funeye/IdeaProjects/next-ai-build/docs/UI/ai-grok-chat.skills.md)。

---

## 当前分层

当前 AI Chat 已按三层落地：

1. `@windrun-huaiin/contracts/ai`
2. `@windrun-huaiin/backend-core/ai`
3. `@windrun-huaiin/third-ui/ai`

对应职责：

- `contracts/ai`
  - 消息模型
  - 状态模型
  - 错误模型
  - 请求/响应协议
  - stream event 协议
  - schema 与纯函数映射工具
- `backend-core/ai`
  - OpenRouter route 主链路
  - abort / timeout
  - guarded stream start
  - mock
  - 上下文与 hooks / adapters 扩展点
- `third-ui/ai`
  - `useAIConversation`
  - 前端流式消费
  - assistant placeholder
  - 停止生成
  - 基础 AI Chat 组件积木
  - text part 的 Markdown 渲染

宿主接入页当前是：

- API 路由：[route.ts](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/api/ai/generate/route.ts)
- 测试页：[ai-runtime-playground.tsx](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/[locale]/(home)/test/ai/ai-runtime-playground.tsx)

---

## 当前实现状态

已完成：

- 共享消息协议与错误协议
- OpenRouter text stream 最小主链路
- SSE event stream 透传到前端
- `useAIConversation()` 前端会话 hook
- `AIMessageList` / `AIMessageBubble` / `AIChatComposer` 基础积木
- text part Markdown 渲染
- 图片 Markdown 基础展示
- playground 页聊天骨架重构

暂未完成：

- 真正的 `image part` / `file part` 资源卡片渲染
- provider 级多模态输入输出适配
- tool calling
- 持久化 / 历史 / 计费 / 锁 的默认业务实现
- 结构化富事件流 beyond text-first

---

## 实施里程碑

为避免原 `dev-plan` 删除后丢失阶段信息，当前实施进度统一在此维护。

### 已完成里程碑

#### 里程碑 1：共享协议层

状态：已完成

已完成内容：

- `MessagePart`
- `ConversationMessage`
- `ConversationSession`
- `AIMessageStatus`
- `AIMessageFailureReason`
- `AIErrorPayload`
- `AIRuntimeRequest`
- `AIRuntimeResponse`
- `AIStreamEvent`
- schema 与状态映射工具

对应代码：

- [packages/contracts/src/ai/index.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/contracts/src/ai/index.ts)

#### 里程碑 2：后端 runtime 最小主链路

状态：已完成

已完成内容：

- `createOpenRouterRoute()`
- Edge route 基础约束
- request 校验
- `buildModelMessages()`
- `createUpstreamAbortSignal()`
- `guardedOpenRouterStreamStart()`
- `normalizeAIError()`
- mock 机制
- SSE event stream 封装

对应代码：

- [packages/backend-core/src/services/ai/route.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/route.ts)
- [packages/backend-core/src/services/ai/openrouter-client.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/openrouter-client.ts)
- [packages/backend-core/src/services/ai/mock.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/mock.ts)

#### 里程碑 3：前端会话与基础积木

状态：已完成

已完成内容：

- `useAIConversation()`
- `sendMessage()`
- `stopGeneration()`
- assistant placeholder
- `text_delta` 增量更新
- `message_completed` / `error` 状态回写
- `AIMessageList`
- `AIMessageBubble`
- `AIChatComposer`

对应代码：

- [packages/third-ui/src/ai/use-ai-conversation.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/use-ai-conversation.ts)
- [packages/third-ui/src/ai/index.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/index.ts)

#### 里程碑 4：聊天布局与 text Markdown 渲染

状态：已完成

已完成内容：

- playground 页聊天骨架重构
- Web 侧栏 / 移动端抽屉
- 消息 `meta + actions` 分区
- 三段式 composer
- text part Markdown 渲染
- Markdown 图片基础展示

对应代码：

- [packages/third-ui/src/ai/ai-markdown.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-markdown.tsx)
- [apps/ddaas/src/app/[locale]/(home)/test/ai/ai-runtime-playground.tsx](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/[locale]/(home)/test/ai/ai-runtime-playground.tsx)

### 进行中里程碑

当前无明确进行中的独立里程碑。

当前阶段处于：

- 基础聊天体系已可用
- 正在进入“补多模态 part 渲染与宿主默认实现”的阶段

### 待开始里程碑

#### 里程碑 5：消息级多模态渲染

状态：未开始

目标：

- `image part` 独立渲染
- `file part` 独立渲染
- 消息级资源块与 Markdown 正文并存

说明：

- 当前协议已支持
- 当前 UI 仅对 text 做正式渲染

#### 里程碑 6：宿主 adapters 默认实现

状态：未开始

目标：

- 登录 / 匿名 session 识别
- 持久化
- 历史消息加载
- billing reserve / settle
- lock
- cache / refresh

说明：

- 当前 runtime 已有 adapter / hook 入口
- 默认业务实现尚未接入

#### 里程碑 7：provider 侧多模态与结构化事件流

状态：未开始

目标：

- provider 级多模态输入 / 输出适配
- 更丰富的 `part` event 流
- 非 text-first 的 structured stream

#### 里程碑 8：高级 AI runtime 能力

状态：未开始

目标：

- tool calling
- memory / summary
- 更完整的会话恢复与编排能力

---

## 当前完成度

从当前仓库代码状态看：

- 协议层：高完成度
- 后端 text-stream runtime：高完成度
- 前端 text-chat runtime：高完成度
- 聊天 UI 基础积木：中高完成度
- 文本富内容展示：中完成度
- 多模态消息渲染：低完成度
- 宿主默认业务能力：低完成度

可以把当前阶段理解为：

- 已完成一个“可真实使用的 text-first AI chat 基础架构”
- 尚未完成一个“完整业务可交付的多模态 AI chat 产品体系”

---

## 待办清单

后续最值得优先推进的事项：

1. 统一聊天可复用的 Markdown component map
2. 实现 `image part` / `file part` 独立 renderer
3. 收口宿主默认 adapters
4. 设计并接入真正的历史会话加载链路
5. 扩展 provider 侧多模态与 structured event stream
6. 再评估 tool calling 与 memory 能力

不建议优先推进的事项：

- 复杂视觉皮肤化
- 完整 MDX 编译链进入聊天消息渲染
- 过早支持所有 provider 的多模态细节

---

## 共享协议

## 消息模型

当前共享消息模型定义在：

- [message.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/contracts/src/ai/message.ts)

核心结构：

```ts
type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; mimeType?: string; alt?: string; source: 'internal' | 'external' }
  | { type: 'file'; url: string; name?: string; mimeType?: string; source: 'internal' | 'external' };

type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  parts: MessagePart[];
  status?: AIMessageStatus;
  failureReason?: AIMessageFailureReason;
  errorMessage?: string;
  upstreamStatusCode?: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
};
```

当前第一版仍以 `text part` 为主，但协议已经不是 text-only。

架构原则：

- 通用消息模型永远基于 `parts`
- 不能退回 `content: string`
- 前端允许当前只完整渲染 `text`
- 后续多模态扩展只扩 `part renderer`，不推翻协议

## 请求协议

当前请求模型定义在：

- [request.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/contracts/src/ai/request.ts)

```ts
type AIRuntimeRequest = {
  sessionId?: string;
  messages: ConversationMessage[];
  modelName?: string;
  metadata?: Record<string, unknown>;
};
```

规则：

- `messages` 是前端当前会话窗口
- `modelName` 可选，优先由宿主覆盖
- `metadata` 仅作为扩展上下文，不默认进入模型上下文

## Stream 协议

当前 stream event 模型定义在：

- [stream.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/contracts/src/ai/stream.ts)

当前事件：

```ts
type AIStreamEvent =
  | { type: 'message_started'; messageId: string; createdAt: number }
  | { type: 'text_delta'; messageId: string; text: string }
  | { type: 'part'; messageId: string; part: MessagePart }
  | { type: 'message_completed'; messageId: string; createdAt?: number; usage?: ... }
  | { type: 'error'; error: AIErrorPayload };
```

当前实际主链路里主要使用：

- `message_started`
- `text_delta`
- `message_completed`
- `error`

`part` 已在协议层与前端状态层预留，但当前后端默认 route 还未正式产出多模态 part event。

## 状态与错误模型

定义在：

- [status.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/contracts/src/ai/status.ts)

状态：

- `streaming`
- `completed`
- `stopped`
- `timeout`
- `request_aborted`
- `failed`

失败原因：

- `invalid_request`
- `auth_error`
- `insufficient_credits`
- `model_access_denied`
- `content_blocked`
- `rate_limited`
- `provider_error`
- `no_provider_available`
- `empty_response`
- `stream_error`
- `unknown`

规则：

- `status` 表达消息生命周期状态
- `failureReason` 表达归因
- `error` 表达可读错误文本
- `upstreamStatusCode` 保留原始上游状态

---

## 后端架构

## 路由入口

宿主侧入口：

- [route.ts](/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/src/app/api/ai/generate/route.ts)

当前直接复用：

```ts
export const POST = createOpenRouterRoute({});
```

说明当前主链路已经收敛到 `backend-core/ai`。

## `createOpenRouterRoute()` 主链路

实现位置：

- [route.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/route.ts)

当前主线：

```text
parse request
-> validate request body
-> build runtime context
-> billing.reserve
-> hooks.beforeCall
-> maybe mock
-> create upstream abort signal
-> build model messages
-> call OpenRouter stream
-> guarded stream start
-> wrap upstream stream to AI event stream
-> hooks.afterCall
-> return SSE response
-> on error normalize + hooks.onError + billing.settle
```

## 后端必须保留的基础约束

当前 route 级约束：

- `runtime = 'edge'`
- `dynamic = 'force-dynamic'`
- `revalidate = 0`

当前 streaming headers：

- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-cache, no-store, max-age=0, must-revalidate, no-transform`
- `Connection: keep-alive`
- `Pragma: no-cache`
- `X-Accel-Buffering: no`

这些属于 runtime 层稳定资产，不应移回宿主页面。

## Abort / timeout

核心实现：

- [abort.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/abort.ts)

职责：

- 合并 request abort 与 timeout
- 向上游 provider 传递 cancel 信号
- 清理 timer，避免泄漏

原则：

- 用户中止必须能映射为 `request_aborted`
- 超时必须能映射为 `timeout`

## Guarded stream start

相关实现：

- [openrouter-client.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/openrouter-client.ts)

当前策略：

- 先验证上游是否真正开始可用流
- 如果在流正式开始前就是错误，则返回真实 JSON 错误和真实 HTTP status
- 只有当上游可流式输出时，才包装成 SSE event stream

架构意义：

- 保留真实上游错误
- 避免把上游失败误判成“空响应”
- 让前端区分“开流前失败”和“流中失败”

## 模型消息构建

实现位置：

- [message-builder.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/message-builder.ts)

当前第一版原则：

- 只稳定支持 text 模型输入
- 保留 `parts` 协议，不强行 provider 侧做完整多模态适配

后续升级方向：

- `buildModelMessages()` 继续作为唯一 provider 输入转换层
- 多模态 provider 适配应只发生在这里，不污染前端协议

## Mock

相关实现：

- [mock.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/mock.ts)
- [env.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/backend-core/src/services/ai/env.ts)

当前 mock 能力：

- 正常流式成功
- 首 token 延迟
- 立即 timeout
- 部分 timeout
- 部分 aborted
- 部分 error

原则：

- mock 也走真实 event stream 语义
- mock 是 runtime 能力，不应放到 UI 层模拟

---

## 前端架构

## 数据层 `useAIConversation()`

实现位置：

- [use-ai-conversation.ts](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/use-ai-conversation.ts)

职责：

- 维护 `messages`
- 维护 `isStreaming`
- 维护 `error`
- 创建 user message
- 创建 assistant placeholder
- 消费 SSE event stream
- 把流式事件映射到消息状态
- 暴露 `sendMessage()` / `stopGeneration()` / `resetConversation()`

当前前端消息更新策略：

1. 用户点击发送
2. 立即插入一条 `user` message
3. 立即插入一条 `assistant` placeholder
4. 请求 `/api/ai/generate`
5. 消费 SSE event
6. `message_started` 修正 assistant message id
7. `text_delta` 追加到 assistant text part
8. `part` 追加 part
9. `message_completed` 置为 `completed`
10. `error` 置为失败状态并回写错误信息

## assistant placeholder 规则

当前 placeholder 规则：

- role 固定为 `assistant`
- parts 初始为一个空 text part
- status 初始为 `streaming`
- metadata 中记录 `aiRuntime.requestStartedAt`

这样做的目的：

- UI 立即出现 assistant 占位
- 流式 token 到来时只做增量追加
- 可以统计 `firstTokenMs` 和 `totalMs`

## runtime metadata

前端消息 metadata 中当前使用：

- `requestStartedAt`
- `streamStartedAt`
- `firstTokenAt`
- `firstTokenMs`
- `completedAt`
- `totalMs`

用途：

- 消息底部 meta 展示
- 调试态性能反馈

原则：

- runtime metadata 是 UI 级 / observability 级元信息
- 不能直接进入 provider prompt

---

## 当前 `third-ui/ai` 组件边界

当前已落地组件：

- [ai-chat-composer.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-chat-composer.tsx)
- [ai-message-list.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-list.tsx)
- [ai-message-bubble.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-bubble.tsx)
- [ai-message-content.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-content.tsx)
- [ai-message-meta.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-meta.tsx)
- [ai-message-actions.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-actions.tsx)
- [ai-markdown.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-markdown.tsx)
- [ai-status-indicator.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-status-indicator.tsx)

边界原则：

- `useAIConversation` 是状态层核心
- `AIMessageList` 负责滚动、空态、阅读宽度、自动贴底
- `AIMessageBubble` 负责消息骨架，不绑定具体业务操作
- `AIMessageContent` 负责 `parts` 渲染分发
- `AIMarkdown` 负责 text part 富文本渲染
- `AIChatComposer` 负责输入壳子，不负责任何历史 / session 逻辑

## Text part Markdown 渲染

当前 text part 渲染已经切到：

- [ai-markdown.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-markdown.tsx)

当前默认支持：

- 段落
- 标题
- 列表
- 引用
- 链接
- 图片
- 基础代码块
- 表格

当前默认图片复用：

- [image-zoom.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/fuma/mdx/image-zoom.tsx)

规则：

- `text part` 用 Markdown 渲染
- `image part` / `file part` 仍应保留独立 renderer 路线
- 不把“所有多模态”都塞回 Markdown

## 自定义 Markdown 组件映射

当前 `AIMarkdown` / `AIMessageContent` / `AIMessageBubble` 已预留 `markdownComponents`。

适用范围：

- 标准标签映射，例如 `img`、`a`、`pre`、`code`
- 这些可以通过传入映射直接复用

不直接等价的内容：

- 文档站 `.mdx` 里的自定义组件语法，例如 `Tabs`、`Mermaid`、`ImageGrid`
- 这类属于 MDX 运行时或编译时能力，不是普通 Markdown 字符串天然支持的能力

结论：

- AI Chat 当前支持的是“Markdown 字符串渲染”
- 不是“完整 MDX 页面编译”

## 自定义组件扩展规则

后续如果要支持类似 `TrophyCard` 这类自定义内容，必须先判断它属于哪一类，不允许直接把所有扩展都塞进 Markdown / MDX 字符串。

### 规则 1：页面 MDX 组件 与 聊天消息结构 是两套不同入口

页面内容和聊天消息可以复用同一个 React 组件，但不应默认复用同一条渲染链。

正确分层：

- 页面 `.mdx`
  - 通过 `mdx-components.tsx` 注册 MDX 组件名
- 聊天消息
  - 通过 `MessagePart -> renderer` 注册消息级组件

可共享的是：

- React 组件本身

不应强行共享的是：

- “让 AI 在消息里直接输出 `<TrophyCard />` 字符串” 这种协议

### 规则 2：适合做 MDX 组件的内容

以下内容更适合定义为 MDX 组件：

- 文档站专属展示组件
- 作者手写内容里的结构化展示块
- 只在页面内容编写阶段出现的组件
- 依赖完整 MDX 编译链的组件

例如：

- `Mermaid`
- `Tabs`
- `ImageGrid`
- `TypeTable`
- 自定义文档卡片

这类组件的接入方式：

1. 把 React 组件放入共享组件目录
2. 在 `mdx-components.tsx` 注册组件名
3. 页面通过 MDX 语法使用

### 规则 3：适合做 `MessagePart` 的内容

以下内容更适合定义为聊天消息级 `part`：

- 图片附件
- 文件附件
- 工具调用结果
- 引用来源块
- 资源卡片
- AI 返回的结构化卡片
- 用户上传并随消息发送的内容

判断标准：

- 它是“一条消息的一部分内容块”
- 它需要独立状态、操作、布局或权限控制
- 它不只是正文排版的一部分

这类内容的实现方式应为：

1. 扩展 `MessagePart`
2. 在 `AIMessageContent` 中增加对应 renderer
3. 如需页面复用，可让页面的 MDX 组件内部复用同一 React 组件

当前仓库中的参考例子：

- 页面组件：[trophy-card.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/fuma/mdx/trophy-card.tsx)
- 协议 part：`trophy_card`
- 聊天渲染入口：[ai-message-content.tsx](/Users/funeye/IdeaProjects/next-ai-build/packages/third-ui/src/ai/ai-message-content.tsx)

### 规则 4：如果页面和聊天都要一致渲染，优先共享 React 组件，不共享字符串协议

如果未来存在 `TrophyCard` 这类内容，希望页面和聊天里都一致渲染，推荐做法：

1. 先实现或复用共享 React 组件，例如 `TrophyCard`
2. 页面侧在 `mdx-components.tsx` 注册 `TrophyCard`
3. 聊天侧在 `MessagePart` 渲染器中使用 `TrophyCard`
4. 协议层定义对应 part，例如 `trophy_card`

推荐结构：

```text
shared React component
-> page MDX mapping
-> chat part renderer
```

而不是：

```text
shared React component
-> let AI output <TrophyCard />
-> chat runtime parses custom MDX string
```

### 规则 5：不要把聊天协议建立在 AI 输出自定义 MDX 标签字符串之上

不推荐让 AI 直接输出：

```mdx
<TrophyCard title="..." />
```

原因：

- 当前聊天链路是 Markdown 运行时渲染，不是完整 MDX 编译链
- AI 输出自定义标签字符串稳定性差
- 安全边界更复杂
- 协议会退化成“让模型拼组件语法”
- 后续调试和多 provider 兼容性都会变差

架构结论：

- 文档系统可以使用自定义 MDX 组件语法
- 聊天系统的可扩展结构应建立在 `MessagePart`

### 规则 6：如何判断一个新能力该落在哪条链路

可以按下面的判断顺序：

1. 它是不是页面作者手写内容时使用的展示组件？
   - 是：优先做 MDX 组件
2. 它是不是聊天消息中的结构化内容块？
   - 是：优先做 `MessagePart`
3. 它是否要求页面和聊天都长得一致？
   - 是：共享 React 组件，但页面和聊天各接自己的渲染入口
4. 它是否只是基础 Markdown 标签表现增强？
   - 是：优先加到共享 Markdown component map

### 规则 7：推荐目录约束

后续新增像 `TrophyCard` 这样的共享内容组件时，推荐遵守：

- 共享可视组件
  - 放在 `packages/third-ui/src/fuma/mdx` 或未来独立的 shared content components 目录
- 页面 MDX 入口
  - 只在 `apps/ddaas/src/components/mdx-components.tsx` 注册
- 聊天消息入口
  - 只在 `packages/third-ui/src/ai/ai-message-content.tsx` 对应 renderer 中接入

这样可以保证：

- 共享的是组件
- 分离的是入口
- 协议不会混乱

---

## 数据流规则

## 发送规则

- 输入框只提交非空文本
- 正在流式时不允许再次发起 `sendMessage`
- 用户主动停止调用 `stopGeneration()`

## 流式消费规则

- 任何 event 都通过统一 `consumeEventStream()` 处理
- 前端按 `event.type` 更新消息
- event stream 中断后，若未收到 `message_completed`，应走 error 分支

## 错误规则

- 请求前校验失败：服务端返回 JSON error
- 开流前 provider 失败：服务端返回 JSON error + 真实 status
- 开流后失败：通过 SSE `error` event 返回

## 消息更新规则

- user message 创建后不再被流式改写
- assistant message 是唯一被 `text_delta` / `part` 持续更新的消息
- error 总是尽量落到“最近一条 assistant message”

## 元数据规则

- `metadata` 允许业务扩展
- UI / runtime metadata 与业务 metadata 可以共存
- 业务方不能依赖 UI metadata 作为后端主逻辑输入

---

## 当前架构决策

## 1. 协议先支持多 part，渲染先完成 text

这是当前最重要的折中：

- 协议不做 text-only
- 前端不强行一次性完成所有多模态渲染

这样既不会把未来锁死，也不会在当前版本里过度实现。

## 2. 聊天消息的富文本先用 Markdown

原因：

- AI 返回正文天然适合 Markdown
- 可覆盖普通用户主要阅读需求
- 实现成本低，收益高

但规则仍然是：

- Markdown 解决正文排版
- `image/file part` 解决消息结构扩展

## 3. UI 组件包提供积木，不绑定宿主业务

`third-ui/ai` 应只提供：

- 状态 hook
- 消息积木
- 输入积木
- Markdown 渲染入口

不应内置：

- 历史会话获取逻辑
- 业务存储逻辑
- 计费策略
- 模型切换策略
- 应用级页面主题

---

## 后续实施方向

优先级建议：

1. 统一聊天可复用的 Markdown component map
2. 完成 `image part` / `file part` 独立 renderer
3. 补宿主 adapters 默认实现
4. 扩到 provider 侧多模态输入 / 输出适配
5. 再考虑 tool calling 与 structured rich events

不建议当前阶段做的事情：

- 把 AI text 渲染直接升级成完整 MDX 编译链
- 在 UI 组件包中硬编码业务历史逻辑
- 在 provider 输入层过早支持所有多模态格式

---

## 文档约束

后续任何涉及 AI Chat 的架构调整，优先更新本文档。

如果代码与文档冲突，以当前代码为准，并立即同步修正文档。
