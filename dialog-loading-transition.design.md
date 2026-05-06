# Dialog Loading Transition Design

## 1. Problem

部分弹窗确认动作并不是纯前端状态切换，而是会触发后端请求。

典型场景包括：

- random 页面范围规划弹窗点击确认后，需要请求后端生成多日计划
- Clear saved set 确认后，需要删除正式保存数据，并等待后端更新分析快照
- Replace saved set 确认后，需要提交保存并刷新详情

当前问题是：

- 用户点击确认后弹窗关闭
- 后端请求和后续数据刷新仍在进行
- 页面缺少统一、明确的过渡态

这会让用户难以判断操作是否已经生效，也容易造成重复点击或误判。

---

## 2. Desired experience

对于需要等待异步动作完成的弹窗确认行为，交互应表现为：

1. 用户点击确认
2. 弹窗立即关闭
3. 页面展示统一的全屏 loading 动画
4. 调用方定义的异步动作执行完成
5. loading 自动消失
6. 页面展示刷新后的业务状态

这里的 loading 动画应与 Next route loading 保持一致。

FAQ 当前 route loading 已经直接复用底层包：

- `apps/faq/src/app/[locale]/loading.tsx`
- `@windrun-huaiin/third-ui/main/loading`

因此这类弹窗过渡态也应直接复用底层 `Loading`，避免业务侧重新封装一套视觉。

---

## 3. Design principle

底层弹窗可以管理“确认动作执行期间的统一 loading 过渡态”，但不应该管理业务逻辑。

也就是说，底层负责：

- 确认后关闭弹窗
- 展示统一全屏 loading
- 等待调用方返回的异步动作结束
- 结束后关闭 loading

调用方负责：

- 实际调用哪个接口
- 成功后刷新哪些数据
- 失败后如何记录错误状态
- 是否需要重新打开弹窗或展示错误提示

这个边界可以让使用方只关注“要做什么”，同时避免底层弹窗理解具体业务。

---

## 4. Proposed API

底层 `ConfirmDialog` 增加受控能力开关：

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Clear saved set?"
  description="This will permanently delete the saved set."
  confirmText="Clear"
  enableLoading
  loadingLabel="Clearing..."
  onConfirm={async () => {
    await deleteSavedSet();
    await loadAnalysis();
    await loadDetail();
  }}
/>
```

建议参数：

- `enableLoading?: boolean`
- `loadingLabel?: string`
- `onConfirm?: () => void | Promise<void>`

默认行为：

- `enableLoading` 默认为 `false`
- 不传 `enableLoading` 时，弹窗保持现有同步确认行为
- 传入 `enableLoading` 且 `onConfirm` 返回 Promise 时，底层展示统一 loading，直到 Promise settle

---

## 5. Confirm behavior

启用 `enableLoading` 后，确认按钮点击语义为：

1. 立即关闭当前弹窗
2. 打开全屏 `Loading`
3. 执行 `onConfirm`
4. 等待 `onConfirm` 完成
5. 关闭全屏 `Loading`

如果 `onConfirm` 抛错：

- loading 仍然需要关闭
- 错误不应被底层吞掉
- 调用方应在自己的状态里记录错误，并在页面合适位置展示

底层可以使用 `try/finally` 保证 loading 一定结束，但不应该决定业务错误文案。

---

## 6. Loading visual

loading 视觉直接复用：

- `@windrun-huaiin/third-ui/main/loading`

这与 FAQ route loading 保持一致。

底层弹窗包内部不需要依赖 FAQ 应用路径，也不需要从 `apps/faq/src/app/[locale]/loading.tsx` 反向引用。

正确依赖方向是：

- FAQ route loading 使用底层 `Loading`
- 弹窗 loading transition 也使用底层 `Loading`

这样所有页面 loading 动画来自同一底层实现。

---

## 7. Scope

第一阶段只建议支持 `ConfirmDialog`。

原因是：

- Clear / Replace / 批量处理确认都属于 ConfirmDialog 语义
- ConfirmDialog 的确认动作天然可能是异步写操作
- 先在一个底层组件里收敛行为，风险更低

`InfoDialog` 暂不建议默认支持该能力。

InfoDialog 主要表达提示和导航，很多确认只是关闭弹窗或跳转焦点，不一定需要全屏 loading。

如果后续确实出现 InfoDialog 异步确认场景，再按同一模式扩展。

---

## 8. Random page usage

random 页面可以优先接入以下场景：

- Clear saved set
- Replace saved set
- Save all planned

这些动作都符合：

- 用户点击确认
- 弹窗关闭
- 后端写操作执行
- 页面刷新分析或详情
- 完成后展示新状态

范围规划弹窗不是 ConfirmDialog，但它应采用同一套异步过渡原则。

FAQ 当前已有实现：

- `apps/faq/src/components/random-date-range-dialog.tsx`

后续沉淀到底层包时，不需要重做滑动弹窗交互，而是基于当前组件进行通用化。

迁移目标不是“重新设计一个日期选择器”，而是把当前已经验证过的范围滑动交互产品化。

底层范围日期组件应保留：

- 滑动窗口
- 左右边界手柄
- 中间区域整体拖拽
- 快捷范围
- 月份和年份切换
- 双击重置参考点
- 默认窗口天数配置

底层范围日期组件应去除：

- `Random` 业务命名
- random 页面专属文案
- plan-range 接口语义
- 任何题组规划或保存逻辑

建议组件命名：

- `RangeDateSliderDialog`

建议 API：

```tsx
<RangeDateSliderDialog
  open={open}
  onOpenChange={setOpen}
  defaultRangeDays={7}
  enableLoading
  loadingLabel="Loading..."
  onApply={async ({ startDate, endDate }) => {
    await doSomething(startDate, endDate);
  }}
/>
```

其中：

- `defaultRangeDays` 用于配置默认滑动窗口天数
- `onApply` 只输出日期范围
- `enableLoading` 控制确认后是否展示统一全屏 loading
- `loadingLabel` 控制 loading 文案

启用 `enableLoading` 后，范围弹窗点击确认的行为应与 ConfirmDialog 保持一致：

1. 点击确认图标
2. 弹窗立即关闭
3. 展示统一全屏 `Loading`
4. 等待 `onApply({ startDate, endDate })` 完成
5. 关闭 loading

random 页面迁移后只保留业务处理：

```tsx
<RangeDateSliderDialog
  open={rangeDialogOpen}
  onOpenChange={setRangeDialogOpen}
  defaultRangeDays={5}
  enableLoading
  loadingLabel="Planning selected range..."
  onApply={async ({ startDate, endDate }) => {
    await planRange(startDate, endDate);
  }}
/>
```

这里的 `planRange` 包含 random 页自己的接口调用、计划数据落入页面状态、选中第一天、刷新右侧详情等业务动作。

底层范围日期组件不应该知道这些业务。

---

## 9. Why not page-level custom state

业务页面当然可以自己维护 loading overlay 状态。

但如果多个弹窗都需要同样体验，会出现重复代码：

- 每个页面都要定义 loading 状态
- 每个确认动作都要手动打开和关闭 loading
- 每个弹窗都要自己决定 overlay 样式
- 不同页面的过渡体验容易不一致

把这个能力放进底层弹窗组件，可以让使用方只通过一个参数启用统一行为。

同时，底层仍不接管业务逻辑，因此不会破坏组件边界。

---

## 10. Final decision

弹窗异步确认过渡态应作为底层 UI 能力提供。

核心结论：

1. `ConfirmDialog` 支持 `enableLoading`
2. loading 动画复用 `@windrun-huaiin/third-ui/main/loading`
3. 弹窗确认后立即关闭，并展示统一全屏 loading
4. loading 生命周期跟随调用方 `onConfirm` 返回的 Promise
5. 业务接口调用、数据刷新、错误展示仍由调用方负责
6. 范围规划弹窗可按同一模式单独支持 `enableLoading`

这个方案既减少业务侧重复实现，也保持底层组件不理解具体业务。
