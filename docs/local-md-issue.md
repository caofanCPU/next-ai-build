定位清楚了，两个都是“底层包顶层静态导入”导致的，不是你业务代码直接用到了才进产物。

  Shiki
  引入链路是：

  src/lib/content-source.ts:1
  -> @windrun-huaiin/fumadocs-local-md/server
  -> dist/server/index.js 顶层静态导入 ./features.js
  -> dist/server/features.js 顶层静态导入 fumadocs-core/mdx-plugins
  -> fumadocs-core/dist/mdx-plugins/index.js 顶层静态导入 ./rehype-code.js
  -> fumadocs-core/dist/mdx-plugins/rehype-code.js 顶层静态导入 ../highlight/shiki/full.js

  关键问题不在你的 feature 开关，而在这几个顶层 import。即使 createFumaDocsCompilerOptions({ features }) 里最终没有启用 code，features.js 还是先把 fumadocs-core/mdx-plugins 整包导进来了，而这个入口又无条件带上了
  rehype-code，最终把 shiki 拉进构建图。

  一句话描述给底层包即可：

  shiki 是被 @windrun-huaiin/fumadocs-local-md/server 的顶层静态导入链路带进来的，不是业务侧启用了 code feature 才进入。dist/server/features.js 顶层 import fumadocs-core/mdx-plugins，而 fumadocs-core 的 mdx-
  plugins 入口又顶层 import rehype-code.js，后者继续顶层 import shiki/full.js，因此 capability 关闭后仍无法裁剪。

  Mermaid
  这里有两条链路，其中至少一条已经足够让它进产物。

  第一条是渲染组件链路：

  src/components/mdx-components.tsx:1
  -> @windrun-huaiin/third-ui/fuma/server/site-mdx-components
  -> site-mdx-components 调 createSiteFeatureComponentMap()
  -> site-mdx-presets.ts 顶层静态导入 ./optional-features
  -> optional-features.tsx 顶层静态导入 ../heavy/mermaid

  也就是说，即使你传入的 features 里没有 mermaid，optional-features.tsx 还是已经在模块加载阶段把 Mermaid 组件所在模块引进来了。

  并且 optional-features.tsx 还同时顶层导入了：

  - fumadocs-ui/components/codeblock
  - ../heavy/math
  - ../heavy/mermaid

  这也是典型的“特性表看起来可选，但实现是静态打包”的问题。

  第二条可能的链路是编译侧还有 remark-mdx-mermaid，但你这次现象里更直接、更确定的是上面这条组件静态导入链。

  一句话描述给底层包即可：

  mermaid 是被 @windrun-huaiin/third-ui/fuma/server/site-mdx-components 这条渲染组件链路静态带进来的。site-mdx-presets.ts 顶层 import optional-features，而 optional-features.tsx 又顶层 import ../heavy/mermaid，所
  以即使 features 里关闭 mermaid，该模块仍然已经进入构建图，无法实现真正裁剪。

  结论
  你现在的裁剪失效，不是 feature 数组判断错了，而是底层包采用了“先顶层 import 全部能力模块，再在运行时按 features 选择”的实现方式。
  这种写法对功能开关有效，但对构建产物裁剪无效。

  如果你要最短版本发给对方，就发这个：

  当前 shiki 和 mermaid 进入产物的根因都是底层包的顶层静态导入。shiki 链路来自 @windrun-huaiin/fumadocs-local-md/server/features.js -> fumadocs-core/mdx-plugins -> rehype-code.js -> shiki/full.js。mermaid 链路来自
  @windrun-huaiin/third-ui/fuma/server/site-mdx-components -> site-mdx-presets -> optional-features -> heavy/mermaid。虽然业务侧传了 feature 开关，但底层是在模块加载时先把所有能力实现 import 进来，导致无法做真正的
  构建裁剪。



  以做到。

  大的判断是：

  在你现在这套架构下，“按 capability 配置对产物做裁剪”是可实现的，但前提是底层包要把当前这种“顶层静态导入所有能力实现”的组织方式，改成“按能力延迟装配/按入口拆分”的组织方式。
  现在的问题不是功能开关没有，而是开关发生得太晚，模块在开关判断之前就已经被 bundler 收进图里了。

  代价不算特别大，但也不是一两行修补。

  原因是这不是单点 bug，更像是一个打包边界设计问题，通常要做这几类调整：

  - 重构能力注册入口，避免聚合文件顶层引入全部 feature
  - 把 code、mermaid、math 这类重模块改成分离入口或延迟加载
  - 重新整理部分类型和导出结构，保证调用方还能保持现有 API 体验
  - 做一次构建验证，确认 feature 关闭时 .next 里真的消失

  所以整体上我会这样定性：

  - 能不能做到：能
  - 是否值得做：如果“模板按能力裁剪产物”是你们这个底层包的重要卖点，那值得做
  - 改动成本：中等，不算特别大，但属于需要专门设计一轮的改造，不是小修
  - 风险：主要是改完后要防止 API 使用方式变复杂，或者引入动态加载导致 SSR/类型体验变差

  一句更短的说法，你可以直接发给对方：

  这个能力在现有条件下是能做的，但需要底层包从“顶层聚合导入全部能力”调整为“按能力拆分入口或延迟装配”。问题本质不是业务配置，而是打包边界设计。改造成本属于中等，不是简单补丁，但也不是推翻重来；如果产物裁剪是底层包
  的重要目标，这个改造是值得做的。