# third-ui 破坏性导出路径变更

以下组件不再从旧 barrel 入口导出，业务需要按新路径导入。

| 组件 / 能力 | 新路径 |
| --- | --- |
| `GradientButton` | `@third-ui/main/buttons` |
| `XButton` | `@third-ui/main/buttons` |
| `XToggleButton` | `@third-ui/main/buttons` |
| `AdsAlertDialog` | `@third-ui/main/alert-dialog` |
| `ConfirmDialog` | `@third-ui/main/alert-dialog` |
| `HighPriorityConfirmDialog` | `@third-ui/main/alert-dialog` |
| `InfoDialog` | `@third-ui/main/alert-dialog` |
| `XPillSelect` | `@third-ui/main/pill-select` |
| `XFilterPills` | `@third-ui/main/pill-select` |
| `XFormPills` | `@third-ui/main/pill-select` |
| `XTokenInput` | `@third-ui/main/pill-select` |
| `CreditNavButton` | `@third-ui/main/credit` |
| `CreditOverviewClient` | `@third-ui/main/credit` |
| `CreditOverviewData` | `@third-ui/main/credit` |
| `CreditOverviewTranslations` | `@third-ui/main/credit` |
| `CreditOverview` | `@third-ui/main/credit/server` |
| `MoneyPriceInteractive` | `@third-ui/main/money-price` |
| `MoneyPriceButton` | `@third-ui/main/money-price` |
| `MoneyPriceData` | `@third-ui/main/money-price` |
| `MoneyPriceConfig` | `@third-ui/main/money-price` |
| `InitUserContext` | `@third-ui/main/money-price` |
| `MoneyPrice` | `@third-ui/main/money-price/server` |
| `buildMoneyPriceData` | `@third-ui/main/money-price/server` |
| `HeroMedia` | `@third-ui/main/hero` |
| `HeroSection` | `@third-ui/main/hero` |
| `Loading` | `@third-ui/main/loading` |
| `getLoadingCycleDurationMs` | `@third-ui/main/loading` |
| `SnakeLoadingFrame` | `@third-ui/main/loading-frame` |
| `SnakeLoadingPreview` | `@third-ui/main/loading-frame` |
| `CTA` | `@third-ui/main/home/server` |
| `FAQ` | `@third-ui/main/home/server` |
| `Features` | `@third-ui/main/home/server` |
| `Gallery` | `@third-ui/main/home/server` |
| `SeoContent` | `@third-ui/main/home/server` |
| `Tips` | `@third-ui/main/home/server` |
| `Usage` | `@third-ui/main/home/server` |
