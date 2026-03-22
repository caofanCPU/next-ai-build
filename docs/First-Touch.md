# First-Touch 设计与参数手册

## 0. 参数速查表

下表对应数据库里 `sourceRef` 这类 JSON 字段中最终可见的键。

| 字段名 | 含义 | 来源 | 典型取值 | 备注 |
| --- | --- | --- | --- | --- |
| `capturedAt` | 首次采集时间 | 前端运行时 | `2026-03-21T18:51:21.189Z` | first-touch 建立时间 |
| `landingUrl` | 首次落地完整 URL | 浏览器当前 URL | `https://diaomao.d8ger.com/pricing?utm_source=google` | first-touch 原始落地页 |
| `landingPath` | 首次落地路径 | 浏览器当前 URL | `/`, `/pricing`, `/test/color` | 不含域名和 query |
| `landingHost` | 首次落地域名与端口 | 浏览器当前 URL | `diaomao.d8ger.com`, `localhost:3000` | 可能带端口 |
| `httpRefer` | 来源页完整 URL | `document.referrer` / `referer` | `https://google.com/...`, `https://d8ger.com/post/1` | 若被 `noreferrer` 清除可能缺失 |
| `refererHost` | 来源页 host | 从 `httpRefer` 解析 | `google.com`, `d8ger.com` | 未知外站也会保留原值 |
| `refererPath` | 来源页 path | 从 `httpRefer` 解析 | `/`, `/search`, `/post/1` | 可能为空 |
| `refererDomain` | 来源根域名 | 从 `httpRefer` 解析 | `google.com`, `d8ger.com` | 用于辅助分析 |
| `utmSource` | 原始 `utm_source` | URL 参数 | `google`, `openai`, `XXXDiaomao` | 原样保留，不做改写 |
| `utmMedium` | 原始 `utm_medium` | URL 参数 | `cpc`, `referral`, `social`, `ai` | 原样保留 |
| `utmCampaign` | 原始 `utm_campaign` | URL 参数 | `spring_sale`, `site_nav` | 原样保留 |
| `utmTerm` | 原始 `utm_term` | URL 参数 | `ai tools`, `seo_keyword` | 常见于搜索广告 |
| `utmContent` | 原始 `utm_content` | URL 参数 | `button_a`, `banner_top` | 常见于 A/B 素材区分 |
| `utmId` | 原始 `utm_id` | URL 参数 | `campaign_001` | 可选 |
| `ref` | 自定义来源标记 | URL 参数 | `d8ger`, `partner_a` | 轻量归因参数 |
| `gclid` | Google Ads 点击 ID | URL 参数 | `EAIaIQob...` | 存在时强提示 Google 广告 |
| `fbclid` | Facebook 点击 ID | URL 参数 | `IwAR...` | 存在时强提示 Facebook |
| `msclkid` | Microsoft/Bing 点击 ID | URL 参数 | `123abc...` | 存在时强提示 Bing |
| `ttclid` | TikTok 点击 ID | URL 参数 | `abc123...` | 存在时强提示 TikTok |
| `twclid` | X/Twitter 点击 ID | URL 参数 | `abc123...` | 存在时强提示 X |
| `liFatId` | LinkedIn 点击 ID | URL 参数 | `abc123...` | 来自 `li_fat_id` |
| `userAgent` | 原始浏览器 UA | 请求头 | `Mozilla/5.0 ...` | 原样保留，可能较长 |
| `deviceType` | 设备类型 | 后端解析 UA | `desktop`, `mobile`, `tablet`, `bot`, `unknown` | 业务使用优先看它 |
| `os` | 操作系统 | 后端解析 UA | `macOS`, `Windows`, `Android`, `iOS`, `Linux` | 可能结合 Client Hints 修正 |
| `browser` | 浏览器 | 后端解析 UA | `Chrome`, `Safari`, `Firefox`, `Edge` | 业务展示友好 |
| `secChUaMobile` | 原始移动端提示头 | 请求头 | `?1`, `?0` | `?1` 表示移动端 |
| `secChUaPlatform` | 原始平台提示头 | 请求头 | `"macOS"`, `"Android"` | 浏览器 Client Hints 原值 |
| `sourceType` | 归因判定方式 | 后端标准化 | `direct`, `referer`, `campaign` | 不是原始值，是推断结果 |
| `sourceChannel` | 标准化渠道 | 后端标准化 | `direct`, `search`, `social`, `ai`, `referral`, `campaign` | 用于统计渠道类别 |
| `sourcePlatform` | 标准化平台 | 后端标准化 | `direct`, `google`, `openai`, `linkedin`, `other` | 未知平台统一归 `other` |
| `isInternalReferer` | 是否站内 referer | 后端比较 landing 与 referer | `true`, `false` | 用于判断是否站内跳转 |

## 1. 目标

本方案用于记录匿名用户第一次访问网站时的来源信息，用来回答下面这类问题：

- 用户最初是从哪里知道本网站的
- 用户是从 Google、OpenAI、社媒、站群互导还是直接访问进入的
- 用户首次落地页是什么
- 用户使用的设备是桌面端还是移动端，系统和浏览器是什么

本方案是 `first-touch attribution`，不是 `last-touch attribution`。

含义是：

- 第一次来源会被记录并尽量保留
- 后续同一设备再次访问，不会用新来源覆盖首次来源
- 如果还需要“最近一次来源”，应单独设计 `last-touch` 或访问日志

---

## 2. 整体流程

### 2.1 前端

`FingerprintProvider` 初始化时，会先在浏览器中采集 first-touch 信息：

- 当前落地页 URL
- URL 上的营销参数
- `document.referrer`
- 采集时间

然后将其写入：

- `localStorage`
- `cookie`

之后匿名初始化接口 `/api/user/anonymous/init` 被调用时，会自动附带：

- fingerprint header
- `x-source-ref`
- `x-first-touch`

### 2.2 后端

后端收到匿名初始化请求后，按下面优先级提取来源：

1. `x-first-touch`
2. `x-source-ref`
3. 浏览器自动 `referer`
4. 当前请求 URL 上的 query 参数

最后会输出两类数据：

- 原始来源数据
- 标准化归因数据

---

## 3. 存储与容错

### 3.1 浏览器侧持久化

first-touch 会持久化在：

- `__x_first_touch` localStorage
- `__x_first_touch` cookie

fingerprint 会持久化在：

- `__x_fingerprint_id` localStorage
- `__x_fingerprint_id` cookie

### 3.2 安全降级

浏览器如果禁用了 `localStorage` 或 `cookie`：

- 不会抛出异常阻塞页面主流程
- 不会影响用户继续访问页面
- 最坏情况只是 first-touch 丢失或不完整

也就是说：

- 访问主流程优先
- 归因失败只降级，不阻塞

---

## 4. 字段来源说明

## 4.1 来自浏览器 URL 的字段

这些字段只要出现在用户打开的链接上，就会被记录。

原始参数：

- `ref`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `utm_id`
- `gclid`
- `fbclid`
- `msclkid`
- `ttclid`
- `twclid`
- `li_fat_id`

后端落库字段：

- `ref`
- `utmSource`
- `utmMedium`
- `utmCampaign`
- `utmTerm`
- `utmContent`
- `utmId`
- `gclid`
- `fbclid`
- `msclkid`
- `ttclid`
- `twclid`
- `liFatId`

落地页字段：

- `landingUrl`
- `landingPath`
- `landingHost`

说明：

- `utm_*` 是原始营销参数
- 这些值会尽量原封不动保留，不做改写
- 例如 `utm_source=XXXDiaomao` 会保存成 `utmSource: "XXXDiaomao"`

## 4.2 来自浏览器环境与请求头的字段

这些字段不是 URL 参数，而是浏览器运行时提供的信息。

来源页相关：

- `document.referrer`
- 请求头 `referer`

后端落库字段：

- `httpRefer`
- `refererHost`
- `refererPath`
- `refererDomain`

设备相关：

- `user-agent`
- `sec-ch-ua-mobile`
- `sec-ch-ua-platform`

后端落库字段：

- `userAgent`
- `deviceType`
- `os`
- `browser`
- `secChUaMobile`
- `secChUaPlatform`

采集时间：

- `capturedAt`

说明：

- `secChUaMobile` 的原始值是浏览器标准值
- `?1` 表示移动端
- `?0` 表示非移动端

## 4.3 后端标准化推断字段

这些字段不是浏览器直接给的，而是后端根据原始字段推断出来的：

- `sourceType`
- `sourceChannel`
- `sourcePlatform`
- `isInternalReferer`

---

## 5. 标准化归因规则

## 5.1 字段职责

### `utmSource`

这是原始值。

特点：

- 保留调用方传入的原始字符串
- 不做标准化改写
- 用于后续明细分析、回溯、排查

示例：

- `utm_source=XXXDiaomao`
- 最终记录为 `utmSource: "XXXDiaomao"`

### `sourcePlatform`

这是标准化归因值。

特点：

- 用于报表、聚合统计
- 只会落入有限的平台集合
- 未识别来源会归到 `other`
- 没有外部来源时归到 `direct`

### `sourceChannel`

这是来源渠道分类。

用于表达来源类别，例如：

- `direct`
- `search`
- `social`
- `ai`
- `referral`
- `campaign`

### `sourceType`

这是归因判定方式。

当前可能值：

- `direct`
- `referer`
- `campaign`

---

## 5.2 已知平台

当前内置可识别的平台包括：

- `openai`
- `anthropic`
- `perplexity`
- `gemini`
- `copilot`
- `google`
- `bing`
- `baidu`
- `yahoo`
- `duckduckgo`
- `facebook`
- `instagram`
- `x`
- `linkedin`
- `reddit`
- `youtube`

## 5.3 未知平台

为了方便 BI 和报表统计，标准化口径如下：

- 已知平台：返回标准平台值
- 未知外部来源：返回 `other`
- 无外部来源：返回 `direct`

注意：

- 未知来源的原始域名仍会保留在 `refererHost` / `refererDomain`
- 未知营销参数的原始值仍会保留在 `utmSource` / `ref`

示例：

- `utm_source=XXXDiaomao`
  - `utmSource = "XXXDiaomao"`
  - `sourcePlatform = "other"` 或命中你自定义规则后的标准值

- 来源页是某个未识别站点 `abc.example.com`
  - `refererHost = "abc.example.com"`
  - `refererDomain = "example.com"`
  - `sourcePlatform = "other"`
  - `sourceChannel = "referral"`

## 5.4 当前兜底逻辑

### `direct`

用于表示用户没有可靠外部来源信息，例如：

- 浏览器地址栏直接输入
- 浏览器书签访问
- referrer 被浏览器或页面策略清除
- 没有 `utm_*` / `ref` / click id

### `other`

用于表示存在外部来源，但无法归入已知标准平台，例如：

- 自定义 `utm_source`
- 未识别的外部 referral 域名
- 未识别的 campaign 来源

---

## 6. 推荐分享参数规范

如果目标是稳定采集来源归因，不建议只依赖浏览器 `referrer`，推荐显式带 URL 参数。

最推荐：

```text
?utm_source=d8ger&utm_medium=referral&utm_campaign=site_nav
```

轻量方案：

```text
?ref=d8ger
```

### 推荐命名

站群互导：

- `utm_source=d8ger`
- `utm_medium=referral`

社媒投放：

- `utm_source=x`
- `utm_medium=social`

搜索投放：

- `utm_source=google`
- `utm_medium=cpc`

AI 平台导流：

- `utm_source=openai`
- `utm_medium=ai`

### 原则

- `utm_source` 尽量短、稳定、可枚举
- `utm_medium` 表示渠道类别
- `utm_campaign` 表示运营活动
- 如果是自有站群互导，优先显式带参数，不要只依赖 referrer

### 例外情况说明

显式带 `utm_*`、`ref`、click id 参数，比依赖浏览器 `referrer` 稳定得多，但仍不能理解为绝对 100% 不受浏览器和链路影响。

通常情况下，只要：

- 用户第一次打开的就是带参数的落地链接
- 落地页 URL 中这些参数没有在跳转过程中丢失
- 前端 first-touch 成功执行

那么这些参数就可以被准确提取。

但以下情况仍可能导致归因不完整：

- 浏览器禁用了 `cookie` 或 `localStorage`
- 首屏脚本未成功执行
- 用户并不是直接落在带参数的首个页面
- 中转页、短链、分享平台或重定向逻辑丢失了 query 参数

因此推荐把归因优先级理解为：

1. 显式 URL 参数
2. first-touch 持久化
3. 浏览器 `referrer`

其中：

- URL 参数是当前方案中最稳定的一层
- `referrer` 只应作为补充信息，不应作为唯一依据

---

## 7. 关于 `noreferrer`

如果跳转链接使用了：

```html
rel="noreferrer"
```

那么目标站通常拿不到来源页 referrer。

影响：

- `document.referrer` 可能为空
- 后端无法判断真实外部来源
- 最终可能被判为 `direct`

`GradientButton` 当前支持：

- 默认 `noopener noreferrer`
- 显式传 `preserveReferrer` 时只保留 `noopener`

示例：

```tsx
<GradientButton
  title="Diaomao"
  href="https://diaomao.d8ger.com?utm_source=d8ger&utm_medium=referral&utm_campaign=site_nav"
  preserveReferrer
/>
```

说明：

- `noopener` 主要是安全保护，建议保留
- `noreferrer` 主要是隐私控制，会影响来源归因

---

## 8. 结果解读示例

## 8.1 用户直接打开首页

可能得到：

```json
{
  "landingPath": "/",
  "sourceType": "direct",
  "sourceChannel": "direct",
  "sourcePlatform": "direct"
}
```

含义：

- 没有外部来源证据
- 判定为直接访问

## 8.2 用户从 Google 广告进入

链接：

```text
https://example.com/?utm_source=google&utm_medium=cpc&gclid=xxx
```

可能得到：

```json
{
  "utmSource": "google",
  "utmMedium": "cpc",
  "gclid": "xxx",
  "sourceType": "campaign",
  "sourceChannel": "search",
  "sourcePlatform": "google"
}
```

## 8.3 用户从未知站点互导进入

如果未带 `utm_*`，但 referrer 存在：

```json
{
  "refererHost": "abc.example.com",
  "refererDomain": "example.com",
  "sourceType": "referer",
  "sourceChannel": "referral",
  "sourcePlatform": "other"
}
```

## 8.4 用户从自定义来源参数进入

链接：

```text
https://example.com/?utm_source=XXXDiaomao&utm_medium=referral
```

可能得到：

```json
{
  "utmSource": "XXXDiaomao",
  "utmMedium": "referral",
  "sourceType": "campaign",
  "sourceChannel": "referral",
  "sourcePlatform": "other"
}
```

---

## 9. 首次来源的业务解释

本方案记录的是“用户最开始是怎么来到本站的”。

例如：

1. 用户第一次从 OpenAI 跳到本站
2. 之后又从 xAI 再次访问本站
3. 设备和 fingerprint 没变

此时首次来源仍应保留为 OpenAI。

这是符合 first-touch 归因逻辑的，因为它回答的是：

- 用户最初从哪里知道本站

如果业务还想知道：

- 用户最近一次从哪里回来
- 哪个渠道把老用户召回

则应额外增加：

- `last-touch`
- 或访问日志事件表

---

## 10. 当前文件位置

前端采集与持久化：

- `packages/third-ui/src/clerk/fingerprint/fingerprint-shared.ts`
- `packages/third-ui/src/clerk/fingerprint/fingerprint-client.ts`
- `packages/third-ui/src/clerk/fingerprint/use-fingerprint.ts`

后端解析与标准化：

- `packages/backend-core/src/app/api/user/anonymous/init/route.ts`

---

## 11. 测试建议

建议至少验证以下场景：

- 地址栏直接访问
- 带 `utm_source` 的外链访问
- 带 click id 的广告访问
- 从 Google 搜索结果进入
- 从 OpenAI / ChatGPT 页面进入
- 从站群互导页面进入
- 使用 `noreferrer` 链接进入
- 移动端与桌面端分别测试

重点观察：

- `landingPath`
- `httpRefer`
- `utmSource`
- `refererHost`
- `sourceType`
- `sourceChannel`
- `sourcePlatform`
- `deviceType`
- `os`
- `browser`
