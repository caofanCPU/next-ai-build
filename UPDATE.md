我的项目政整合了很多第三方平台或工具：clerk, stripe,upstash,supabase,fumadocs等。
然后我的packages目录下提供了很多个通用工具包，例如packages/base-ui，以及脚手架脚本命令 packages/dev-scripts。
同时我还在维护另一个工程级别的模板项目diaomao， 它就是整合了我这里的packages下的工具包，成为模板项目，
我的用户通过diaomao模板创建新的项目很方便得到一套 设计优美、安全、且便捷的可上线产品网站。
现在你先不要里面的代码文件，先分析我的问题：

这些第三方经常进行依赖包更新， 因为我的对接方，我的通用工具包会关注信息然后进行依赖更新与测试，
当我测试完成后，我的项目其实就能得到使用这些依赖的当前最新的版本：
那么我如何让这些新的版本号通过 cli命令 直接更新好 diaomao项目里的对应依赖版本呢？
如果做好了，我的用户也能用cli命令一键更新好对应的依赖。

这是当前要解决的主要问题， 只是更新依赖包版本。

再进阶一点， 如果存在破坏性更新，也就是需要改代码，因为diaomao是模板项目，我只会对我维护的通用模块进行更新与修改，
如果我的用户能通过cli命令，将这些通用的变更也同步到他们自己的代码里去就更好了， 这点其实就像github的fork形式，fork放可以拉取source的各种变更来实时更新。我们肯定不需要做得这么重， 请给出比较简单但又能实现目标的方案。

下面的内容是我看到了turbo的cli命令，它的这种形式我觉得很好，它会很清楚的告诉你一些更新过程和更新结果，你改了哪些文件等重要信息，给你参考


## 工程化升级

包升级

 pnpm dlx @turbo/codemod@latest update
 WARN  1 deprecated subdependencies found: cross-spawn-async@2.2.5
Packages: +110
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 110, reused 94, downloaded 16, added 110, done
✔ Where is the root of the repo to migrate? .
Upgrading turbo from 2.7.4 to 2.8.12 (1 required codemod) 

(1/1) Running update-versioned-schema-json
 INFO  Updating "$schema" property in turbo.json files to versioned format... 
 INFO  Updated "$schema" in /Users/funeye/IdeaProjects/next-ai-build/turbo.json 
 MODIFIED  turbo.json 

Results:
┌────────────┬────────────┬───────────┬───────────┬────────┐
│ (index)    │ action     │ additions │ deletions │ error  │
├────────────┼────────────┼───────────┼───────────┼────────┤
│ turbo.json │ 'modified' │ 1         │ 1         │ 'None' │
└────────────┴────────────┴───────────┴───────────┴────────┘

Upgrading turbo with pnpm add turbo@latest --save-dev -w 

Migration completed


## 最终方案定稿

### 目标收敛

`diaomao-update` 只做一件事：

- 帮助使用方项目把依赖版本升级到我当前 monorepo 中已经验证通过的推荐版本

明确不做的事情：

- 不维护历史升级轨迹
- 不做 migration
- 不自动改业务代码
- 不自动新增依赖
- 不自动安装依赖
- 不做降级操作

也就是说，这个命令的核心价值就是：

- 用户本来也可以自己慢慢比对和升级
- 但通过 `diaomao-update` 可以一键完成，节省时间


### 唯一版本真源

不再单独维护一份依赖版本清单。

当前 monorepo 中的 `pnpm-workspace.yaml` 已经天然是依赖版本真源，因此后续更新命令直接以它为准。

使用方执行 CLI 时，不读取本地 monorepo，而是直接从 GitHub 拉取远程原始文件内容。

默认远程地址为：

```text
https://raw.githubusercontent.com/caofanCPU/next-ai-build/main/pnpm-workspace.yaml
```

注意：

- 不使用 GitHub 页面地址
- 必须使用 `raw.githubusercontent.com` 的原始文件地址


### CLI 命令名称

最终命令名称确定为：

```bash
diaomao-update
```


### 用户侧配置文件

用户侧开放配置文件：

- `apps/ddaas/dev-scripts.config.json`

CLI 工程内提供参考模板文件：

- `packages/dev-scripts/example.config.json`

这个示例文件的作用是：

- 给使用方参考如何配置变量


### 配置项范围

第一阶段配置项只保留最小必要集合：

1. 更新源 URL

- 默认值就是上面的 GitHub raw 地址
- 用户允许覆盖这个地址
- 主要用于紧急情况备用，例如临时切换更新源

2. 允��更新的包白名单

- 白名单只控制哪些包允许参与同步
- 白名单不维护版本
- 版本始终来自远程 `pnpm-workspace.yaml`

3. 日志是否简洁

- 默认开启简洁模式
- 因为用户初期关注完整日志，但后续高频使用时更关注重点结果


### 命令执行流程

`diaomao-update` 执行流程如下：

1. 读取使用方配置文件
2. 从配置的远程地址拉取 `pnpm-workspace.yaml`
3. 解析白名单范围内的推荐依赖版本
4. 读取使用方项目中的 `package.json`
5. 对已有依赖做版本比较
6. 只对可升级的依赖执行写入
7. 输出结果表格和最终统计


### 版本比较规则

对于每个白名单依赖，按以下规则处理：

1. 使用方项目中不存在该包

- 跳过
- 不自动新增依赖

2. 使用方版本低于我的推荐版本

- 执行升级

3. 使用方版本等于我的推荐版本

- 不改

4. 使用方版本高于我的推荐版本

- 不改
- 记录为额外日志信息
- 因为命令只做升级，不做降级

也就是说，需要支持检测“使用方版本比我们还新��的情况，并明确跳过，不覆盖用户当前更高版本。


### 日志输出原则

日志不做重复打印。

不再分别打印：

- 哪些包可以更新
- 实际更新了哪些包
- 哪些包被修改了
- 结果

这些信息会合并到一份结果输出中。

日志风格参考 Turbo，核心采用表格形式，重点字段为：

- 包名
- 修改前版本
- 修改后版本

表格重点只展示真正发生升级的依赖。

默认简洁模式下：

- 不重点展开“已是最新”
- 不重点展开“项目中不存在而跳过”
- 不重点展开“用户版本更高而跳过”

这些内容如果需要，可以作为额外日志信息补充，或在详细模式下展示。


### 结果统计

表格输出完成后，最后给出一条汇总统计信息即可，例如：

- 共更新了多少个包版本

如果存在“使用方版本比推荐版本更高”的依赖，也可作为额外补充统计信息展示，但不应喧宾夺主。


### 第一阶段实现边界

第一阶段只聚焦依赖升级能力闭环：

- 远程拉取 `pnpm-workspace.yaml`
- 解析推荐版本
- 根据白名单过滤
- 更新使用方项目已有依赖
- 以简洁表格输出结果

后续如有破坏性更新：

- 不在 CLI 中自动做代码迁移
- 直接让用户通过 GitHub 的变更记录、release 信息或其他人工备注来查看具体变更

这样可以最大程度降低实现复杂度，同时完整满足当前核心需求。
