# AI OpenRouter Component Implementation Design

本文档基于 [docs/AI-architecture.md](./AI-architecture.md)、和 [docs/implem.md](./implem.md)，描述如何把现有能力实施为可复用的通用 AI OpenRouter 组件。

目标是让后续实现者能够完整正确地做出：

- 前端 AI 交互数据流组件
- 后端 Edge AI router
- 前后端共享消息与错误模型
- 业务可接入但不过度侵入的存储与计费扩展点

本文档不负责定义具体 UI 样式，也不负责定义业务 prompt、业务消息卡片或业务数据库表结构。

## 实施目标

最终组件需要覆盖四类能力：

1. OpenRouter 主链路
2. 前端流式消费与消息更新
3. 通用错误/状态处理
4. 业务扩展点接入

其中，真正属于组件封装范围的重点是：

- 数据流规则
- 请求生命周期
- 共享类型
- 错误与状态语义
- 调用前后扩展点

## 建议组件拆分

建议拆成三层，而不是做成一个大而全的库。

### 1. shared

职责：

- 消息类型
- part 类型
- 状态与失败原因
- 错误 payload
- 请求/响应 schema
- 状态码映射工具

建议包含：

- `AIMessageStatus`
- `AIMessageFailureReason`
- `AIErrorPayload`
- `MessagePart`
- `ConversationMessage`
- `mapHttpStatusToMessageStatus`
- `mapHttpStatusToFailureReason`

### 2. server-edge

职责：

- Edge route 主链路
- OpenRouter 调用
- abort / timeout
- guarded stream start
- mock 场景
- 调用前后业务扩展点

### 3. client

职责：

- 发送请求
- 创建本地 placeholder message
- 读取 stream
- 停止生成
- 更新消息状态
- 匿名模式下浏览器存储
- 调用业务历史消息 API

## 共享消息模型

通用组件必须直接采用多模态消息模型，而不是沿用当前项目的纯文本最终形态。

推荐模型：

```ts
type MessagePart =
  | { type: "text"; text: string }
  | { type: "image"; url: string; mimeType?: string; alt?: string; source: "internal" | "external" }
  | { type: "file"; url: string; name?: string; mimeType?: string; source: "internal" | "external" };

type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  parts: MessagePart[];
  status?: AIMessageStatus;
  failureReason?: AIMessageFailureReason;
  errorMessage?: string;
  upstreamStatusCode?: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
};
```

兼容当前纯文本的方式：

- 用户和 assistant 只写入一个 `text` part
- 不再把 `content: string` 作为最终通用模型

## 后端 Edge Router 主线

通用后端组件应把当前 route 落成稳定主线：

```text
parse request
-> validate request
-> before_ai_call
-> maybeHandleMock
-> build model messages
-> create upstream abort signal
-> call OpenRouter
-> guarded stream start
-> stream response to client
-> settle_ai_call
-> persist_ai_messages
-> normalize error
```

### 路由层必须保留的能力

- `runtime = "edge"`
- `dynamic = "force-dynamic"`
- `revalidate = 0`
- 流式防缓冲 headers
- `createUpstreamAbortSignal`
- `normalizeAIError`
- guarded stream start

这些代码资产应直接参考 [docs/implem.md](/Users/funeye/IdeaProjects/practice-yes-and/docs/implem.md) 实现。

## 请求协议

通用组件的请求协议不应保留当前项目的业务字段，例如 `context`、`isInitialPractice`。

建议最小请求体：

```ts
type AIRuntimeRequest = {
  sessionId?: string;
  messages: ConversationMessage[];
  modelName?: string;
  metadata?: Record<string, unknown>;
};
```

其中：

- `messages` 是前端当前可见消息窗口
- `modelName` 可由业务覆盖，否则使用默认配置
- `metadata` 只用于业务扩展点，不应默认进入模型上下文

## 模型输入构建

后端组件应单独提供 `buildModelMessages()`，把前端展示消息转换成模型输入消息。

基本规则：

- 过滤掉不应进入模型上下文的状态字段
- 过滤掉失败消息
- 过滤掉纯 UI metadata
- 只保留模型可理解的 content

对于第一版实施：

- 可以先只支持 `text` part 进入模型
- `image` / `file` part 先保留模型层接口，不强行在第一版打通所有 provider 格式

这样能兼容当前项目，同时不锁死未来能力。

## Stream 协议实施

第一版组件建议继续支持两套模式：

- `text stream`
- `structured stream`

但落地优先级上：

- 先把 text stream 做稳定
- 同时在服务端和 shared 层预留 structured stream 类型

text stream 的实施必须继承当前项目的关键做法：

- 先消费 `fullStream`
- 如果首个有效事件是错误，则直接返回 JSON 错误
- 如果首个有效事件是数据 part，则开始流式透传

后续升级 structured stream 时，首个有效事件可以是：

- `text_delta`
- `image`
- `file`

而不再只接受 `text-delta`。

## 错误处理实施

错误处理直接复用 [docs/implem.md](/Users/funeye/IdeaProjects/practice-yes-and/docs/implem.md) 的这些资产：

- `AIErrorPayload`
- `createAIErrorPayload`
- `normalizeAIError`
- `mapHttpStatusToMessageStatus`
- `mapHttpStatusToFailureReason`

必须遵守的原则：

- 优先保留 OpenRouter / provider 返回的原始错误 message
- 同时稳定映射 `failureReason`
- 在流开始前失败时返回真实 HTTP status
- 在流开始后失败时通过消息状态或结构化错误事件表达

## 前端实施

前端通用组件不负责业务 UI，只负责交互数据流。

必须封装的能力：

- 发送消息请求
- 插入本地 user message
- 插入 assistant placeholder
- 读取流
- 用户停止生成
- 更新 `status`
- 更新 `failureReason`
- 匿名模式浏览器存储

## Frontend Message Handling Rules

前端消息处理应尽量沿用当前项目 text stream 的简单思路，不引入额外状态机。多模态支持的核心变化，不是改写整个交互逻辑，而是把：

```ts
content: string
```

升级为：

```ts
parts: MessagePart[]
```

然后继续使用“占位消息 + 增量更新 + 结束后改状态”的模式。

### 1. 用户发送消息

当用户点击发送时，前端固定执行两步：

1. 立即插入一条 user message
2. 立即插入一条 assistant placeholder

推荐 assistant placeholder 形态：

```ts
const assistantPlaceholder: ConversationMessage = {
  id,
  role: "assistant",
  parts: [],
  status: "streaming",
  createdAt: Date.now(),
};
```

### 2. text stream 的更新规则

如果当前还是 text stream，前端处理规则应保持最简单：

- 收到文本 chunk 时，更新当前 assistant message
- 如果 `parts` 最后一个 part 是 `text`，就把文本追加进去
- 如果最后一个 part 不是 `text`，就 append 一个新的 `text` part

推荐逻辑：

```ts
function appendAssistantText(message: ConversationMessage, delta: string) {
  const nextParts = [...message.parts];
  const lastPart = nextParts[nextParts.length - 1];

  if (lastPart?.type === "text") {
    nextParts[nextParts.length - 1] = {
      ...lastPart,
      text: lastPart.text + delta,
    };
  } else {
    nextParts.push({ type: "text", text: delta });
  }

  return {
    ...message,
    parts: nextParts,
    status: "streaming",
  };
}
```

### 3. 多模态 part 的更新规则

如果后端开始返回结构化事件，则前端继续沿用 append-only 思路：

- 收到 `text_delta` -> 走文本追加逻辑
- 收到 `image` -> append 一个 `image` part
- 收到 `file` -> append 一个 `file` part

推荐规则：

- 不回头重排已有 part
- 不在前端重新推断资源类型
- 后端给什么 part，前端就按顺序写入什么 part

这样能最大限度保持实现简单。

### 4. 正常完成

stream 正常结束后：

- 保留当前已有 `parts`
- 把 assistant message 的 `status` 改成 `completed`

### 5. 用户主动停止

用户点击停止时：

- 中止当前请求
- 保留已经收到的 `parts`
- 把 assistant message 的 `status` 改成 `stopped`

这和当前项目保留 partial text 的策略一致。

### 6. timeout / request_aborted / failed

这三类情况也保持简单处理：

- 保留已经收到的 `parts`
- 更新 `status`
- 写入 `failureReason`
- 如有原始错误文本，可写入 `errorMessage`

如果失败发生在流开始前，前端也可以直接根据后端返回的 `AIErrorPayload` 创建一条失败 assistant message：

```ts
{
  id,
  role: "assistant",
  parts: payload.error ? [{ type: "text", text: payload.error }] : [],
  status: payload.status,
  failureReason: payload.failureReason,
  upstreamStatusCode: payload.upstreamStatusCode,
  errorMessage: payload.error,
  createdAt: Date.now(),
}
```

### 7. 历史消息恢复

无论消息来自：

- 浏览器存储
- DB 查询
- Redis 缓存

前端在内存中统一都只认 `ConversationMessage`。

也就是说：

- 浏览器存储结构建议直接与运行时消息结构一致
- 后端返回历史消息时，也应尽量直接返回 `ConversationMessage[]`

这样可以减少前端额外转换逻辑。

### 8. 哪些消息不应再次进入模型上下文

前端虽然可以保留所有消息用于展示，但后续发给后端时，不应把纯展示失败消息当成正常对话内容继续发送。

最简单规则：

- `failed` / `timeout` / `request_aborted` 的 assistant 消息默认不参与后续模型上下文
- `stopped` 的 assistant 消息是否参与上下文，由后端 Context Builder 决定

前端不需要在这里做复杂判断，只需要把完整消息结构传回后端，由后端统一过滤。

### 当前 text stream 的前端实施

第一版可以先按当前 text-only 流式逻辑实现：

```ts
const reader = response.body.getReader();
const decoder = new TextDecoder();
let text = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  if (value) {
    text += decoder.decode(value, { stream: true });
    updateAssistantTextPart(text);
  }
}
```

但通用组件内部不应把这个实现暴露成最终模型，而应对外继续维护 `parts[]`。

## 浏览器存储实施

匿名用户浏览器存储属于组件内部能力，可以直接封装。

建议职责：

- 保存匿名 session
- 保存匿名消息列表
- 恢复最近一次会话
- 切换会话时更新本地缓存

这一层不需要和 DB / Redis 做强一致性设计。

## 业务扩展点实施

按照当前架构约定，通用组件必须保留三类后端扩展点：

1. `before_ai_call`
2. `settle_ai_call`
3. `persist_ai_messages`

但实施方式不做任意 hook 系统，而是固定 API 约定。

推荐方式：

```text
Edge AI router
-> fetch business before_ai_call API
-> fetch OpenRouter
-> fetch business settle_ai_call API
-> fetch business persist_ai_messages API
```

默认行为：

- 如果业务未提供这些 API，则空实现或仅日志输出

### before_ai_call

用途：

- 余额检查
- 预扣费
- Redis 分布式锁
- 幂等检查

### settle_ai_call

用途：

- `completed` -> 确认扣费
- `stopped` -> 确认扣费
- `timeout` -> 释放预占
- `request_aborted` -> 释放预占
- `failed` -> 释放预占

### persist_ai_messages

用途：

- 登录用户消息落库
- 发 QStash
- 异步刷新 Redis

消息持久化是业务侧职责，不是通用组件内置存储实现。

## Mock 实施

Mock 必须是通用组件的一部分，因为它直接关系到前端状态机和后端流式链路测试。

应实施的能力：

- 开关控制
- 固定场景编号
- 立即失败
- 流中失败
- 首包前延迟

第一版可以沿用 text-only mock 输出方式；但 mock 抽象层要允许未来扩展成多模态事件。

## 文案实施边界

通用组件只保留：

- 通用错误文案
- 通用状态文案

不保留：

- 业务 prompt
- 业务初始化话术
- 业务 mock 文本
- 业务上下文分类

这部分应严格按照 [docs/implem.md](./implem.md) 的边界执行。

## 实施顺序建议

建议按下面顺序实现：

1. shared types 与 error/status mapping
2. edge router 主链路
3. guarded stream start
4. client text stream 读取
5. browser storage
6. mock 场景
7. before/settle/persist 三个业务扩展 API
8. structured stream 预留
9. 多模态 part 接入

这样可以先交付一版稳定的 text-stream runtime，再逐步升级到多模态。

## 验收标准

后续其他 AI 如果按照本文档实施，应当能够完整正确地做出：

- 一个在 Edge Runtime 中运行的 OpenRouter AI router
- 一个支持流式读取、停止生成、状态更新的前端数据流组件
- 一套共享的消息、状态、错误、失败原因模型
- 一套正确的状态码映射和错误标准化实现
- 可配置的 mock 测试能力
- 可接入业务 API 的 `before_ai_call`、`settle_ai_call`、`persist_ai_messages`
- 匿名模式浏览器存储
- 为多模态 part 和 structured stream 预留清晰扩展位

如果实施结果仍然把业务 prompt、业务上下文和业务存储逻辑硬编码进通用组件，则视为不符合本文档要求。
