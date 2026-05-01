# Upstash 网络延迟排查记录

日期：2026-05-01

测试目标：`UPSTASH_REDIS_REST_URL/ping`

Redis 封装层的 debug 日志显示，一些很简单的 Redis 命令也有数百毫秒耗时：

```text
[Upstash Debug] Redis set completed in 1401ms status=ok
[Upstash Debug] Redis get completed in 409ms status=ok
[Upstash Debug] Redis get completed in 410ms status=ok
[Upstash Debug] Redis mget completed in 410ms status=ok
[Upstash Debug] Redis llen completed in 411ms status=ok
[Upstash Debug] Redis lrange completed in 521ms status=ok
[Upstash Debug] Redis hgetall completed in 899ms status=ok
```

这些耗时明显不像 Redis 命令自身执行慢，更像是应用运行环境到 Upstash REST endpoint 之间的网络往返延迟。

## 测试命令

```bash
set -a
source apps/ddaas/.env.local
set +a

for i in 1 2 3 4 5; do
  curl -sS --max-time 10 -o /dev/null \
    -w "run=$i dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s ttfb=%{time_starttransfer}s total=%{time_total}s http=%{http_code}\n" \
    -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
    "$UPSTASH_REDIS_REST_URL/ping"
done
```

字段含义：

- `dns`：域名解析耗时。
- `connect`：TCP 连接建立完成时间。
- `tls`：TLS 握手完成时间。
- `ttfb`：收到首字节时间。
- `total`：整个 HTTP 请求总耗时。

## 测试数据

### 本地网络故障时

本地网络异常期间测到过一次：

```text
dns=0.144502s connect=0.261872s tls=1.963890s ttfb=2.546530s total=2.546627s http=200
```

这组数据属于网络故障状态。TLS 和总耗时都异常偏高。

### 之前网络恢复后

```text
run=1 dns=0.086963s connect=0.213059s tls=0.343138s ttfb=0.575111s total=0.575191s http=200
run=2 dns=0.003086s connect=0.137054s tls=0.273212s ttfb=0.576347s total=0.576459s http=200
run=3 dns=0.002911s connect=0.128326s tls=0.254282s ttfb=0.488376s total=0.488525s http=200
```

同一个 `curl` 进程内连续请求，用来观察连接复用后的表现：

```text
dns=0.111276s connect=0.330909s tls=0.554740s ttfb=1.163326s total=1.163436s http=200
dns=0.000018s connect=0.000000s tls=0.000000s ttfb=0.678005s total=0.678095s http=200
dns=0.000017s connect=0.000000s tls=0.000000s ttfb=0.392534s total=0.392696s http=200
```

### 切换网络后

```text
run=1 dns=0.556225s connect=0.607860s tls=0.662236s ttfb=0.883706s total=0.883788s http=200
run=2 dns=0.003141s connect=0.055721s tls=0.112164s ttfb=0.336039s total=0.336114s http=200
run=3 dns=0.003779s connect=0.055620s tls=0.115314s ttfb=0.336926s total=0.337334s http=200
run=4 dns=0.003918s connect=0.057130s tls=0.112713s ttfb=0.333340s total=0.333510s http=200
run=5 dns=0.004381s connect=0.057982s tls=0.116507s ttfb=0.339509s total=0.339955s http=200
```

观察结果：

1. 切换网络后的第一次请求有明显 DNS/冷连接成本，总耗时 `884ms`。
2. 后续请求稳定在 `333ms - 340ms`。
3. 预热后 DNS 很低，大约 `3ms - 4ms`。
4. 预热后 TCP connect 大约 `56ms - 58ms`。
5. 预热后 TLS 大约 `112ms - 117ms`。
6. 即使预热后，总耗时仍然有 `333ms - 340ms`，说明主要成本仍然是网络往返和 Upstash REST 边缘服务响应。

## 诊断

当前应用里的 debug 日志统计的是完整 Redis REST 请求耗时，不只是 Redis 服务端命令执行耗时。

简单 Redis 命令出现 `300ms+` 耗时，和网络/REST 往返延迟高度一致。

切换网络后确实有明显改善：

```text
之前恢复后的网络：489ms - 576ms / ping
当前切换后的网络：333ms - 340ms / warm ping
```

但对于首屏渲染或 API 热路径来说，单次 Redis REST 请求 `300ms+` 仍然偏高。如果一次请求里存在多次串行 Redis 调用，整体响应会被明显拖慢。

## 建议

1. 检查 Upstash Redis 实例所在 region，并和应用部署 region 对齐。
   如果应用运行环境离 Upstash region 很远，优先考虑换到更近的 Upstash region，或把应用运行环境移动到 Redis 附近。

2. 在真实生产运行环境里跑同样的 curl 测试。
   本地在 `Asia/Shanghai` 的测试只能说明本地到 Upstash 的链路情况。线上如果部署在 Vercel、Cloudflare 或其他云区域，延迟可能完全不同。

3. 减少热路径里的 Redis REST 往返次数。
   能合并的地方优先使用 `mget`、`pipeline`，或者维护一个预聚合 key，避免多次独立的 `get`、`llen`、`lrange`、`hgetall`。

4. 避免把非关键 Redis 读取放在首屏阻塞路径上。
   比如计数器、列表摘要、派生元数据可以考虑延迟加载或缓存。

5. 对高频且低风险的读取加短 TTL 进程内缓存。
   很短的 TTL 也能减少本地开发和流量峰值时的重复 REST 延迟。



faq本地测试数据很明确：本地小批量查询时，缓存是负优化。

  对比：

  - 缓存开启：
      - Redis mget：~1376ms
      - service 总耗时：~2300ms
      - route 总耗时：~2.9s
  - 缓存关闭：
      - DB 查询：4ms - 9ms
      - service 总耗时：4ms - 10ms
      - route 总耗时：136ms - 196ms


这次链路已经定位得比较清楚了。

  总耗时拆分：

  SDK HTTP total: 827ms
  FAQ route handler: 531ms
  FAQ auth total: 343ms
  service total: 185ms
  Redis mget raw: 87ms

  FAQ 服务端内部已经占了：

  343 + 185 ≈ 528ms

  和 route 531ms 基本对齐。说明主要慢点就在 FAQ 服务端 handler 内，不是业务方到 FAQ 的网络。

  最明显的两个耗时点：

  load_active_key: 99ms
  touch_last_used_at: 239ms
  cacheDurationMs: 185ms
  Upstash mget: 87ms

  这里有两个结论：

  1. touch_last_used_at 是最大单点，239ms，而且它是每次请求都写 DB。
     这个应该先优化。读题接口不应该被“更新 key 最近使用时间”阻塞。建议改成异步 fire-and-forget，或者加节流。最小改法是：

     void touchOuterClientKeyLastUsedAt(clientId, keyVersion).catch(...)

     这样 route 至少能少 239ms 左右。

  2. cacheDurationMs 185ms 但 Upstash debug 是 87ms，说明 getOuterQuestionDetailCacheMap 包装层还有接近 100ms。

  1. 先把 touch_last_used_at 从同步链路移走。
     预期这条请求从 route 531ms 降到大约 290ms。
  2. 再考虑 active key 缓存。
     load_active_key 99ms 每次都查 DB，也可以缓存 client key 公钥，比如内存 LRU/TTL 1-5 分钟。这样 auth 可以再省 99ms。
  3. 最后看 Redis wrapper 的 185ms vs 87ms 差值。
     先不用急，因为最大收益在 DB 写和 DB 读。

  还有 SDK HTTP 827ms 和 FAQ route 531ms 之间差了约 296ms。这部分包含：

  业务方 fetch 发起/TLS/平台 external api 统计口径
  FAQ function 进入 route 前后
  response 回传与 SDK response.text/json parse

  但因为 FAQ route 内已经 531ms，先把服务端内部压下来最划算。