# AI Chat Local-md Plan

## Goal

This document describes a practical plan for reusing the low-level rendering capabilities of `@windrun-huaiin/fumadocs-local-md` inside the AI chat UI.

The goal is not to move the whole file-based `local-md` source system into chat. The goal is to extract and reuse the markdown and MDX compile/render pipeline for string-based chat messages.

## Core Idea

The current chat UI already has a usable message layout, message lifecycle, and streaming interaction model.

What is missing is a stronger message-body renderer.

So the plan is:

- keep the current chat UI structure
- keep the current stream/message protocol layer
- replace the lightweight custom markdown conversion logic with a string-based renderer built from `local-md` internals

That means chat will reuse:

- markdown compilation
- MDX compilation
- remark / rehype plugin support
- React component injection

But chat will not reuse:

- directory scanning
- page tree generation
- local file source loading
- frontmatter-driven docs source behaviors

## Recommended Architecture

```text
AI stream text
  -> accumulated message content
  -> throttled render snapshot
  -> local-md string renderer
  -> ReactNode
  -> AI message bubble
```

This keeps responsibilities clean:

- chat protocol controls streaming
- string renderer controls markdown / MDX rendering
- message bubble only displays the rendered result

## Proposed New API

The new ability should be designed as a standalone API and should only reuse the low-level compiler and renderer.

Suggested direction:

```ts
createMarkdownStringRenderer(options)
```

Possible usage:

```ts
const renderer = createMarkdownStringRenderer({
  components,
});

const result = await renderer.render({
  content,
  path: 'chat-message.mdx',
});
```

Suggested result shape:

```ts
{
  body: ReactNode;
  toc: TOCItemType[];
  structuredData: StructuredData;
  exports: Record<string, unknown>;
}
```

## Why This Should Be Independent

This capability should not be added as part of `localMd({ dir })`.

Reasons:

- chat input is a string, not a file source
- chat rendering does not need directory scanning
- chat rendering does not need page source management
- chat rendering should remain usable in any runtime feature that receives markdown strings

So this is better treated as:

- a string renderer
- not a local content source

## Scope For Chat

The chat use case does not need full document-site flexibility.

The target scope should be intentionally smaller and more controlled.

Recommended support scope:

- headings
- paragraphs
- lists
- blockquotes
- tables
- inline code
- fenced code blocks
- links
- images
- GFM-style markdown
- a small whitelist of MDX components

## Math Support

Math support is possible, but the recommended approach is not to restore every old free-form math syntax.

For chat, the more stable approach is:

- use `<MathBlock formula=\"...\" />`
- use `<InlineMath formula=\"...\" />`

Reasons:

- these components already exist
- rendering behavior is already controlled
- AI output can be guided to follow this explicit format
- this avoids fragile parsing rules for partial or ambiguous math syntax

So for chat rendering, math should be treated as a whitelist component feature, not as an unrestricted syntax feature.

## Custom MDX Components

Chat can support custom MDX components, but only through a controlled whitelist.

Recommended approach:

- inject only explicitly approved components
- do not allow arbitrary document-page MDX capability

Examples of suitable chat-safe components:

- `MathBlock`
- `InlineMath`
- a small set of read-only visual or semantic display components

Examples of components that should not be opened by default:

- file-system-oriented docs components
- complex page-layout components
- components that assume full docs routing context

## Streaming Strategy

The current chat page already demonstrates that markdown-like content can be shown progressively without overengineering the renderer.

So the recommended strategy is simple:

- accumulate streamed text
- throttle re-rendering
- always render the latest full accumulated snapshot

This is enough for the intended chat UX.

There is no need to build:

- incremental markdown AST patching
- token-level parser recovery
- a dedicated streaming markdown engine

## Why Incomplete Markdown Has Not Been A Major Problem So Far

In the existing chat page, incomplete markdown has not become a visible blocker mainly because:

- the current renderer is relatively tolerant
- common chat content mostly uses a simpler markdown subset
- many incomplete states are short-lived and get fixed by the next chunk quickly

This means the chat scenario does not need a highly academic streaming parser design.

A practical snapshot re-render model is enough.

## Implementation Stages

### Stage 1: String Renderer

Build a reusable string-based markdown / MDX renderer on top of `local-md` internals.

Expected result:

- render a complete markdown string into React content
- support existing plugin chain
- support component injection

### Stage 2: Chat Integration

Replace the current lightweight markdown rendering path inside chat message bubbles.

Expected result:

- AI messages render with stronger markdown support
- existing chat layout remains unchanged
- streaming behavior still works through snapshot updates

### Stage 3: Controlled MDX Extensions

Gradually open a small whitelist of MDX components for chat.

Expected result:

- math works through explicit components
- future chat-safe custom components can be added without turning chat into a full docs page renderer

## Practical Boundaries

This plan should not try to make chat equal to docs pages.

It should deliberately avoid:

- full docs-page feature parity
- unrestricted MDX runtime behavior
- page-level routing assumptions
- file-based source abstractions

The chat renderer should be stronger than the current lightweight implementation, but still narrower than the full document-site rendering stack.

## Final Position

This work is feasible and the scope is moderate.

It should be approached as:

- extracting a reusable markdown string renderer from `local-md`
- then plugging that renderer into the chat message body layer

This is the cleanest path to improving markdown support in chat without overloading the existing chat architecture.

## 开发任务清单

### 第一阶段：抽离字符串渲染能力

- 在 `packages/local-md` 中新增独立的字符串渲染入口，不走 `localMd({ dir })` 的文件扫描流程
- 复用现有 `createMarkdownCompiler()`
- 复用现有 `createMarkdownRenderer()`
- 设计新的字符串渲染 API，例如 `createMarkdownStringRenderer()`
- 支持传入 `content`
- 支持传入虚拟 `path`，用于区分 `.md` / `.mdx`
- 支持传入 `components`
- 返回 `body`、`toc`、`structuredData`、`exports`

### 第二阶段：限定聊天场景支持范围

- 明确聊天消息只支持常用 Markdown 子集
- 明确聊天消息只开放白名单 MDX 组件
- 不支持文档站页面级能力
- 不支持目录扫描、page tree、frontmatter source 管理
- 不支持任意复杂 docs 上下文依赖组件

### 第三阶段：接入数学公式能力

- 聊天场景中支持 `<MathBlock />`
- 聊天场景中支持 `<InlineMath />`
- 不恢复旧的自由格式 math fence 兼容
- 在提示词或协议层约束 AI 输出使用显式数学组件
- 确认聊天消息里数学公式的主题样式与站点亮暗色一致

### 第四阶段：接入聊天 UI

- 在现有聊天消息渲染链中找到正文渲染入口
- 用新的字符串渲染器替换当前轻量 Markdown 转换逻辑
- 保持现有消息气泡、元数据区、状态区、会话区不变
- 保持现有 AI / 用户消息布局不变
- 保持现有 session 和 composer 行为不变

### 第五阶段：处理流式快照渲染

- 保持现有流式协议层不动
- 对流式 chunk 做字符串累计
- 使用节流策略触发重新渲染
- 每次都渲染“当前累计后的完整快照”
- 不做增量 AST patch
- 不做 token 级别 parser 恢复

### 第六阶段：定义组件白名单

- 先只注入最少组件
- 第一批建议包含：`MathBlock`、`InlineMath`
- 如有必要，再加入少量纯展示型组件
- 不默认开放依赖页面路由、文档上下文、文件系统语义的组件

### 第七阶段：错误与兜底策略

- 渲染失败时提供纯文本兜底
- 流式过程中如果某次快照渲染失败，不影响后续 chunk 继续刷新
- 为聊天场景单独定义日志或调试输出，便于排查哪段消息触发了解析失败

### 第八阶段：验证清单

- 验证普通段落、标题、列表、引用是否正常
- 验证代码块、行内代码、表格是否正常
- 验证链接、图片是否正常
- 验证 `MathBlock`、`InlineMath` 是否正常
- 验证白名单组件是否正常注入
- 验证流式输出时消息是否能持续刷新
- 验证渲染失败时是否能平稳兜底
- 验证亮色 / 暗色主题下样式是否一致

### 第九阶段：后续可选增强

- 增加聊天场景专用的 renderer options
- 增加可选缓存策略
- 增加更细粒度的消息级错误边界
- 增加更多聊天专用白名单组件
- 如果未来有必要，再考虑更强的未闭合 Markdown 容错能力
