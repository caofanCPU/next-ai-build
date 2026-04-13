# AI OpenRouter Implementation Assets

本文档沉淀当前项目里已经验证过、适合进入通用 AI OpenRouter 组件封装的实现资产。

目标不是照搬现有项目代码，而是把其中真正通用、可复用、可扩展的代码设计抽出来。当前项目的实现仍然以 text stream 为主，因此本文档会明确区分：

- 可以直接保留的通用实现模式
- 只能作为过渡方案的 text-only 实现
- 明确不应进入通用组件的业务特有内容

## 适合保留的实现资产

当前最值得保留的实现资产主要来自以下文件：

- [route.ts](./ai-generate/route.ts)
- [ai-generate-error.ts](./ai-generate-error.ts)
- [ai-generate-mock.ts](./ai-generate-mock.ts)
- [ai-message-status.ts](./ai-message-status.ts)


## 1. Edge Route 基础约束

这一组配置值得直接保留到通用后端组件。

```ts
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;
```

保留原因：

- OpenRouter 流式调用本身适合 Edge Runtime。
- `force-dynamic` 和 `revalidate = 0` 明确关闭缓存。
- 后续业务扩展点也应围绕 edge-safe 方式设计。

注意：

- `maxDuration` 是平台相关配置，通用组件里应作为可配置项，而不是写死。

## 2. 防缓冲 Streaming Headers

这一组 headers 已经比较完整，适合直接进入通用组件。

```ts
const streamingHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate, no-transform",
  Connection: "keep-alive",
  Pragma: "no-cache",
  "X-Accel-Buffering": "no",
};
```

保留原因：

- 明确表达流式纯文本输出。
- 尽量减少代理或平台缓冲。
- 与当前 OpenRouter text stream 链路兼容。

后续演进：

- 如果升级成 structured stream，可把 `Content-Type` 升级为 SSE 或 NDJSON，但 `no-transform` 和 `X-Accel-Buffering` 仍然保留。

## 3. 上游 Abort Signal 转发

`createUpstreamAbortSignal()` 这段思路是非常值得保留的。

```ts
function createUpstreamAbortSignal(requestSignal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  const forwardAbort = () => {
    clearTimeout(timeoutId);
    controller.abort(requestSignal.reason ?? "request_aborted");
  };

  if (requestSignal.aborted) {
    forwardAbort();
  } else {
    requestSignal.addEventListener("abort", forwardAbort, { once: true });
  }

  controller.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timeoutId);
      requestSignal.removeEventListener("abort", forwardAbort);
    },
    { once: true },
  );

  return controller.signal;
}
```

保留原因：

- 统一了“用户中断”和“应用超时”两条取消链路。
- 避免 timeout timer 泄漏。
- 把 `request.signal.reason` 向上游传递，便于最终状态判断。

这段实现不依赖 text-only，因此可以直接进入通用后端 runtime。

## 4. Guarded Stream Start 模式

`createGuardedTextStreamResponse()` 的核心思路非常关键，应保留。

核心设计：

- 不直接把 provider stream 原样返回给前端。
- 先检查 `fullStream` 的起始事件。
- 如果先收到 `error`，直接返回结构化错误 JSON 和真实 HTTP status。
- 如果先收到 `text-delta`，再真正开始透传流。
- 如果没有错误也没有文本，归类为 `empty_response`。

这个模式的价值是：

- 避免把 OpenRouter 的真实 `403`、`429`、`502` 误判成空响应。
- 保留真实 HTTP status。
- 前端能区分“流未开始前的失败”和“流开始后的失败”。

当前项目代码是 text-only 的：

```ts
if (firstChunk.value.type === "error") {
  const aiError = normalizeAIError(firstChunk.value.error);
  return Response.json(aiError, { status: aiError.upstreamStatusCode ?? 500 });
}

if (firstChunk.value.type === "text-delta") {
  break;
}
```

对通用多模态组件的保留方式不是继续写死 `text-delta`，而是升级成：

- 允许首个有效 part 为 `text_delta`
- 也允许首个有效 part 为 `image` / `file` / 其他结构化 part
- `error` 仍然优先于任何数据 part

因此，应保留的是“guarded stream start 策略”，不是保留 text-only 分支本身。

## 5. 错误标准化模块

[ai-generate-error.ts](./ai-generate-error.ts) 的职责拆分是对的，应直接保留思路。

推荐保留的职责包括：

- 从 AI SDK / provider error 中提取可读错误文本
- 标准化输出统一 `AIErrorPayload`
- 将 HTTP status 映射为稳定的消息状态和失败原因
- 兜底处理未知异常

当前代码里的关键模式：

```ts
export function createAIErrorPayload(params: {
  message: string;
  upstreamStatusCode: number;
  failureReason?: AIMessageFailureReason;
}): AIErrorPayload {
  const failureReason =
    params.failureReason ??
    mapHttpStatusToFailureReason(params.upstreamStatusCode, params.message);

  return {
    error: params.message,
    status: mapHttpStatusToMessageStatus(params.upstreamStatusCode),
    failureReason,
    upstreamStatusCode: params.upstreamStatusCode,
  };
}
```

这段设计很重要，因为它把三件事稳定分开了：

- `error`: 给用户或前端展示的可读文本
- `status`: 消息状态语义
- `failureReason`: 业务归因

应保留。

## 6. 状态与失败原因枚举

[ai-message-status.ts](./ai-message-status.ts) 是一份很好的共享基础资产。

建议直接沉淀到 shared package 的内容：

```ts
export const AI_MESSAGE_STATUSES = [
  "streaming",
  "completed",
  "stopped",
  "timeout",
  "request_aborted",
  "failed",
] as const;

export const AI_MESSAGE_FAILURE_REASONS = [
  "invalid_request",
  "auth_error",
  "insufficient_credits",
  "model_access_denied",
  "content_blocked",
  "rate_limited",
  "provider_error",
  "no_provider_available",
  "empty_response",
  "stream_error",
  "unknown",
] as const;
```

同时值得保留的还有：

- `isAIMessageStatus`
- `isAIMessageFailureReason`
- `mapHttpStatusToMessageStatus`
- `mapHttpStatusToFailureReason`

这组代码本身不依赖具体业务，也不依赖 text-only，可直接复用。

## 7. OpenRouter 状态码映射策略

当前项目里最有价值的不是“枚举本身”，而是这个策略：

- 先保留真实 `upstreamStatusCode`
- 再映射通用消息状态
- 再映射稳定 `failureReason`
- 对 `403` 允许根据 message 二次判定 `content_blocked` 或 `model_access_denied`

这一点在多模型、多 provider、不同部署环境下都很关键，必须保留。

推荐保留的映射规则：

```ts
400 -> failed + invalid_request
401 -> failed + auth_error
402 -> failed + insufficient_credits
403 -> failed + model_access_denied | content_blocked
408 -> timeout
429 -> failed + rate_limited
499 -> request_aborted
502 -> failed + provider_error
503 -> failed + no_provider_available
default -> failed + unknown
```

## 8. Mock 场景机制

[ai-generate-mock.ts](./ai-generate-mock.ts) 很值得保留，但要保留的是“机制”，不是它现在的 text-only 细节。

值得保留的机制：

- 统一 mock 开关
- 固定数字场景
- 场景化延迟、立即失败、流中失败
- mock 响应仍然走真实 HTTP / stream 语义

当前文件里这组场景定义就是很好的资产：

```ts
type MockFailureType = "timeout" | "request_aborted" | "stream_error";

type MockScenario = {
  initialDelayMs?: number;
  streamFailureType?: MockFailureType;
  streamFailureAfterChunks?: number;
  immediateErrorType?: MockFailureType;
};
```

建议保留的 mock 场景：

- 正常流式成功
- 首包前延迟成功
- 立即 timeout
- 流中 timeout
- 流中 request_aborted
- 流中 stream_error

需要改造的部分：

- 当前 `createMockStreamResponse()` 只会按词块输出文本
- 通用多模态组件应允许 mock `text` / `image` / `file` 事件

## 9. 主功能文案从控制流中抽离

这是当前实现里非常值得保留的一点，但要注意“只保留通用文案常量”。

可保留的通用文案类型：

- 错误文案 key
- 状态文案 key
- 默认系统级错误文本

当前项目里可复用的是这种模式：

```ts
export const AI_GENERATE_ERROR_MESSAGES = {
  invalidJsonRequestBody: "Invalid JSON request body",
  contextRequired: "context is required",
  contextNotSupported: "context is not supported",
  timeout: "timeout",
  requestAborted: "request_aborted",
  errorCommunicatingWithAI: "Error communicating with AI",
  emptyAIResponse: "AI returned an empty response",
} as const;
```

和：

```ts
export const ASSISTANT_STATUS_COPY = {
  stopped: "Generation stopped by user.",
  timeout: "Generation timed out before completion.",
  requestAborted:
    "Generation stopped because the request was aborted before completion.",
  failed: "Generation failed before completion.",
} as const;
```

不能保留到通用组件里的内容：

- `PRACTICE_INITIAL_USER_PROMPT`
- `buildSystemPrompt(context)`
- `createMockTextByContext(...)`
- 任何练习场景、业务 prompt、角色设定、上下文分类

结论：

- 文案剥离这个模式应保留
- 但只沉淀通用错误与状态文案
- 业务 prompt 与业务 mock 文本必须排除

## 10. Route 中适合保留的调用主线

当前 route 的主线非常清晰，适合进入通用后端组件：

1. 解析请求体
2. 校验必要参数
3. 按配置进入 mock 或真实模型流
4. 构造模型消息
5. 创建 OpenRouter client
6. 创建 timeout + abort signal
7. 调 `streamText`
8. 用 guarded response 返回
9. 统一兜底错误

但需要做两个泛化：

- 去掉当前项目的 `context`、`isInitialPractice` 这类业务特有请求字段
- 把 text-only `messages: { role, content: string }[]` 升级成通用消息输入

适合保留的 route 组织方式：

```ts
parseRequest()
-> validateRequest()
-> maybeHandleMock()
-> buildModelMessages()
-> createProviderClient()
-> createAbortSignal()
-> streamModel()
-> createGuardedResponse()
-> normalizeError()
```

## 11. 当前实现的局限，不能原样保留

这些内容在通用组件里不能原样继承：

- text-only 消息输入与输出
- route 直接理解业务 `context`
- 业务专属 system prompt 拼接
- 业务专属 mock 文本
- 仅返回纯文本 `Response`

也就是说，当前实现最有价值的是：

- 错误处理模式
- 状态码映射模式
- mock 机制
- abort / timeout 机制
- guarded streaming 机制

不是它当前那套具体的业务 prompt 和 text-only request shape。

## 12. 可直接进入通用组件的最小代码清单

建议优先抽出的代码资产：

- `AIMessageStatus`
- `AIMessageFailureReason`
- `AIErrorPayload`
- `mapHttpStatusToMessageStatus`
- `mapHttpStatusToFailureReason`
- `createAIErrorPayload`
- `normalizeAIError`
- `createUpstreamAbortSignal`
- `streamingHeaders`
- `MockScenario` 定义
- `maybeHandleMock` 的机制
- guarded stream start 策略

这些已经足以支撑后续实现：

- 通用 edge AI router
- 通用前端流式消费层
- 通用错误处理层
- 可扩展的 mock 测试层

## 验收标准

如果后续其他 AI 依据本文档实施，至少应能正确做出以下能力：

- 在 Edge Runtime 中调用 OpenRouter 并返回真实流式响应
- 正确区分流开始前失败和流中失败
- 正确映射 `status`、`failureReason`、`upstreamStatusCode`
- 正确处理 timeout、request abort、provider error、empty response
- 保留通用错误与状态文案剥离
- 支持 mock 场景测试
- 不把业务 prompt、业务 mock 文本、业务上下文字段误抽进通用组件
- 为后续多模态扩展留下结构化 part / structured stream 的接口
