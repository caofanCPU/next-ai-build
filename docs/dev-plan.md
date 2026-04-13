# AI Runtime Development Plan

本文档记录当前仓库 AI runtime 通用化封装的实施步骤。目标不是先做某个业务页面，而是先把可发包复用的分层和协议定下来，再逐步补齐服务端运行时、前端交互层、宿主适配层。

## 分层目标

推荐分三层实施：

1. `@windrun-huaiin/contracts/ai`
2. `@windrun-huaiin/backend-core/ai`
3. `@windrun-huaiin/third-ui/ai`

职责划分：

- `contracts/ai`：AI runtime 公共契约层，承载消息模型、状态模型、错误模型、请求/响应协议、stream 协议、纯函数映射工具。
- `backend-core/ai`：服务端运行时层，承载 OpenRouter 调用、Edge route 主链路、abort/timeout、guarded stream start、mock、上下文构建、扩展 hook 与 adapters。
- `third-ui/ai`：前端交互层，承载消息发送、assistant placeholder、流式消费、停止生成、匿名浏览器存储、基础 AI UI 积木。

## 当前进度

- 第一阶段：已完成
- 第二阶段：已完成
- 第三阶段：已完成
- 宿主接入验证：已完成 `apps/ddaas` 最小测试链路
- 第四阶段：暂未开始

当前已落地内容：

- `@windrun-huaiin/contracts/ai` 契约层已创建并完成首版类型、状态、错误、schema、stream event 定义
- `@windrun-huaiin/backend-core/ai` 服务端 runtime 首版已创建并完成最小主链路
- `@windrun-huaiin/third-ui/ai` 前端交互层首版已创建并完成 hook 与基础组件
- `apps/ddaas` 已新增 `/api/ai/generate` 测试 route
- `apps/ddaas` 已新增 `/{locale}/test/ai` 测试页面

当前状态说明：

- 现在可以先在 `apps/ddaas` 内验证 contracts -> backend-core -> third-ui 的完整通路
- 第四阶段的业务默认 adapters（计费、锁、持久化、缓存链路）暂未接入

## 第一阶段：建立协议层 `@windrun-huaiin/contracts/ai`

状态：已完成

先建立独立契约层，不先碰业务 route 和 UI。第一阶段重点是把 AI runtime 的公共语言固定下来。

首批内容：

- `MessagePart`
- `ConversationMessage`
- `ConversationSession`
- `AIMessageStatus`
- `AIMessageFailureReason`
- `AIErrorPayload`
- `AIRuntimeRequest`
- `AIRuntimeResponse`
- `AIStreamEvent`
- `mapHttpStatusToMessageStatus`
- `mapHttpStatusToFailureReason`
- `isAIMessageStatus`
- `isAIMessageFailureReason`

阶段目标：

- 契约层独立可编译、可发包
- 不依赖 React、Next、Prisma、OpenRouter SDK
- 为 `backend-core/ai` 与 `third-ui/ai` 提供统一协议边界

## 第二阶段：在 `backend-core` 中实现 AI server runtime

状态：已完成

新增 AI server runtime 子模块，优先打通最小可用主链路。

建议子路径：

- `@windrun-huaiin/backend-core/ai`
- `@windrun-huaiin/backend-core/ai/edge`
- `@windrun-huaiin/backend-core/ai/adapters`

首版主链路：

`parse request -> validate -> beforeCall -> maybeMock -> buildModelMessages -> call OpenRouter -> guarded stream start -> settle -> normalize error`

首批核心模块：

- `createOpenRouterRoute()`
- `createUpstreamAbortSignal()`
- `normalizeAIError()`
- `createAIErrorPayload()`
- `buildModelMessages()`
- `createGuardedStreamResponse()`
- `maybeHandleMock()`

业务相关能力通过 adapter / hook 注入，不在 runtime 主链路里硬编码：

- `storageAdapter`
- `billingAdapter`
- `lockAdapter`
- `historyAdapter`
- `hooks.beforeCall`
- `hooks.afterCall`
- `hooks.onError`

## 第三阶段：在 `third-ui` 中实现 AI client/runtime 交互层

状态：已完成

新增前端 AI runtime 子模块，先交付稳定的数据流，再考虑复杂 UI。

建议子路径：

- `@windrun-huaiin/third-ui/ai`
- `@windrun-huaiin/third-ui/ai/hooks`
- `@windrun-huaiin/third-ui/ai/components`

首批能力：

- `useAIConversation()`
- `sendMessage()`
- `stopGeneration()`
- `appendUserMessage()`
- `createAssistantPlaceholder()`
- `consumeAIStream()`
- `updateMessageStatus()`
- `browserSessionStore`

基础 UI 组件只提供通用积木，不绑定业务皮肤：

- `AIChatComposer`
- `AIMessageList`
- `AIMessageBubble`
- `AIStatusIndicator`

## 第四阶段：补宿主适配层与默认实现

状态：未开始

最后再把当前项目的业务能力以默认 adapters 的形式接入：

- 登录 / 匿名 session 识别
- 余额检查
- 预扣费
- 分布式锁
- DB 持久化
- QStash 异步刷新
- Redis 历史消息缓存
- 调用后结算

原则：

- runtime 只定义扩展点
- 当前项目在 `backend-core` 内提供默认实现
- 其他应用接入时可复用默认实现或自行替换

## 实施顺序

1. `contracts/ai`
2. `backend-core/ai` 最小 text stream 版本
3. `third-ui/ai` 最小会话 hook 版本
4. 默认宿主 adapters
5. 多模态、structured stream、memory summary 等增强能力

## 第一版范围控制

第一版只确保以下能力跑通：

- text-only message parts
- OpenRouter text stream
- 错误标准化
- assistant placeholder + 增量更新
- stop / timeout / request aborted
- adapter 扩展点预留

暂不在第一版内强行实现：

- 全量多模态 provider 格式适配
- tool calling
- 复杂 memory / summary
- 深度业务持久化策略
