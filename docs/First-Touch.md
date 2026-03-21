first-touch 已经做进 fingerprint 通用层了，宿主项目不需要改页面代码；升级包版本后，FingerprintProvider 这条链路会自动开始持久化和上传首次来源。

  这次只动了你希望的通用层和匿名初始化路由：

  - packages/third-ui/src/clerk/fingerprint/fingerprint-shared.ts
  - packages/third-ui/src/clerk/fingerprint/fingerprint-client.ts
  - packages/third-ui/src/clerk/fingerprint/use-fingerprint.ts
  - packages/backend-core/src/app/api/user/anonymous/init/route.ts

  现在的行为是：

  - 前端首次进入站点时，会在 packages/third-ui/src/clerk/fingerprint/fingerprint-client.ts:161 抓取首访信息：landingUrl、document.referrer、utm_*、gclid/fbclid/...
  - 这份数据会持久化到 localStorage + cookie，键名在 packages/third-ui/src/clerk/fingerprint/fingerprint-shared.ts:8
  - useFingerprint 在生成 fingerprint 之前就会先捕获 first-touch，避免站内跳转把首访上下文覆盖掉，见 packages/third-ui/src/clerk/fingerprint/use-fingerprint.ts:48
  - 之后每次匿名初始化请求都会自动带上 x-first-touch header，见 packages/third-ui/src/clerk/fingerprint/fingerprint-client.ts:297
  - 后端优先解析 x-first-touch，再 fallback 到 x-source-ref 和浏览器自动 referer，并且把 x-source-ref 优先级提到了 referer 前面，见 packages/backend-core/src/app/api/user/
    anonymous/init/route.ts:374 和 packages/backend-core/src/app/api/user/anonymous/init/route.ts:501

  这就解决了你之前那类问题：用户第一次从 Google、OpenAI、ChatGPT、社媒广告等进站，即使匿名初始化发生在 hydration 后或后续站内跳转后，首访来源也不会轻易丢。

  验证结果：

  - pnpm --filter @windrun-huaiin/third-ui type-check
  - pnpm --filter @windrun-huaiin/backend-core type-check

  都通过了。

  还有一个边界我直接说明：如果用户在浏览器里禁用了存储，或者某些来源天然不传 referrer，那任何方案都无法 100% 还原来源；但在正常浏览器场景下，这版已经是比较稳的 first-touch 方
  案了。