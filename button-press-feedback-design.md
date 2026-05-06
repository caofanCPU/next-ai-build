# GradientButton and XButton Press Feedback Design

## Context

`@windrun-huaiin/third-ui/main/buttons` currently exposes `GradientButton` and `XButton` from the `third-ui` package. The installed package includes source under:

- `apps/faq/node_modules/@windrun-huaiin/third-ui/src/main/buttons/gradient-button.tsx`
- `apps/faq/node_modules/@windrun-huaiin/third-ui/src/main/buttons/x-button.tsx`

The FAQ app already proved that stable press feedback should not rely only on CSS `:active`. Light trackpad taps and fast mouse clicks can make `:active` visible for too short a time. The reliable behavior comes from explicit pressed state plus a short post-click flash.

## Existing Components

### GradientButton

Current shape:

- Props include `title`, `icon`, `align`, `disabled`, `className`, `iconClassName`, `href`, `openInNewTab`, `preserveReferrer`, `onClick`, `loadingText`, `preventDoubleClick`, and `variant`.
- If `onClick` is provided, it renders a native `<button>`.
- If `onClick` is not provided, it renders a Next `<Link>`.
- It owns loading state through `isLoading`.
- It builds styles from `baseButtonStyles`, `variantClassName`, `alignmentClass`, disabled state, and caller `className`.
- It currently uses hover styles and `transition-all`, but has no explicit pressed state.

Important implication: press feedback must work for both the `<button>` path and the `<Link>` path.

### XButton

Current shape:

- Supports `type: 'single'` and `type: 'split'`.
- Single mode renders one native `<button>`.
- Split mode renders a main button and a dropdown trigger button.
- Split menu items are rendered as native `<button>` elements.
- It owns loading state through `isLoading`.
- It owns dropdown state through `menuOpen`.
- It uses variant classes for `default`, `soft`, and `subtle`.
- It currently has hover styles and `transition-colors`, but no explicit pressed state.

Important implication: `XButton` has multiple press targets, so its pressed state should be keyed, not boolean.

## Recommendation

Add shared press feedback primitives inside `third-ui`, then wire them into both components.

Recommended split:

- Hook handles interaction state.
- Components own visual classes.
- Existing public behavior remains unchanged by default, except for improved pressed feedback.

Do not push fixed visual styles into the hook. A gradient pill, neutral button, split dropdown button, and menu item need different pressed styles.

## Shared Hook

Create a small hook near button internals, for example:

`src/main/buttons/use-press-feedback.ts`

Suggested API:

```tsx
'use client';

import { useState } from 'react';

export type PressFeedbackKey = string;

export function usePressFeedback<T extends PressFeedbackKey>(durationMs = 180) {
  const [pressedKey, setPressedKey] = useState<T | null>(null);

  function release(key: T) {
    setPressedKey((current) => (current === key ? null : current));
  }

  function trigger(key: T) {
    setPressedKey(key);
  }

  function flash(key: T) {
    setPressedKey(key);
    window.setTimeout(() => {
      setPressedKey((current) => (current === key ? null : current));
    }, durationMs);
  }

  function getPressProps(key: T) {
    return {
      onPointerDown: () => trigger(key),
      onPointerUp: () => release(key),
      onPointerLeave: () => release(key),
      onPointerCancel: () => release(key),
      onBlur: () => release(key),
    };
  }

  return { pressedKey, trigger, release, flash, getPressProps };
}
```

This mirrors the working pattern in `RandomDateRangeDialog` and `QuestionListFilters`.

Why no timer ref:

- The FAQ app uses React hooks lint rules that flagged a ref-based timer helper when returned handlers were created during render.
- The simple `window.setTimeout` version avoids that issue and is enough for visual feedback.
- If the package later needs stricter timer cancellation, implement it with `useEffectEvent` or a carefully lint-compliant internal callback strategy.

## Public API

Add an optional prop to both components:

```ts
type PressFeedback = boolean | 'none' | 'subtle' | 'solid';
```

Recommended default:

```ts
pressFeedback?: PressFeedback;
```

Default behavior:

- `undefined` should mean enabled with `'subtle'`.
- `false` and `'none'` disable the feature.
- `'subtle'` is the default for most app buttons.
- `'solid'` is for controls that need strong tactile feedback, such as compact icon buttons, split controls, calendar controls, and filters.

This keeps the migration backward-compatible while allowing callers to opt out.

## GradientButton Implementation Plan

Extend props:

```ts
export interface GradientButtonProps {
  // existing props...
  pressFeedback?: PressFeedback;
}
```

Add internal constants:

```ts
const PRESS_FEEDBACK_MS = 180;

const gradientPressSubtleClass =
  'translate-y-px scale-[0.98] shadow-inner brightness-95';

const gradientPressSolidClass =
  'translate-y-[2px] scale-[0.96] shadow-[inset_0_2px_4px_rgba(15,23,42,0.22)] brightness-90';
```

Use the hook:

```tsx
const pressMode = pressFeedback === false || pressFeedback === 'none'
  ? 'none'
  : pressFeedback ?? 'subtle';
const { pressedKey, flash, getPressProps } =
  usePressFeedback<'root'>(PRESS_FEEDBACK_MS);
const isPressed = pressMode !== 'none' && pressedKey === 'root' && !isDisabled;
```

Class composition should avoid conflicting rest and pressed classes where possible:

```tsx
const pressClassName = isPressed
  ? pressMode === 'solid'
    ? gradientPressSolidClass
    : gradientPressSubtleClass
  : null;
```

Button path:

```tsx
<button
  type="button"
  className={buttonClassName}
  onClick={(event) => {
    if (!isDisabled && pressMode !== 'none') {
      flash('root');
    }
    handleClick(event);
  }}
  disabled={isDisabled}
  {...(pressMode !== 'none' ? getPressProps('root') : {})}
>
```

Link path:

```tsx
<Link
  href={href || '#'}
  className={cn(buttonClassName, 'no-underline hover:no-underline')}
  onClick={(event) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    if (pressMode !== 'none') {
      flash('root');
    }
  }}
  {...(pressMode !== 'none' ? getPressProps('root') : {})}
>
```

Important details:

- Do not apply pressed feedback while `disabled` or `isLoading`.
- Keep `preventDoubleClick` behavior unchanged.
- Keep `openInNewTab` and `preserveReferrer` behavior unchanged.
- Replace `transition-all` with a more targeted transition if possible: `transition-[transform,background-color,filter,box-shadow,border-color,color]`.

## XButton Implementation Plan

Extend props:

```ts
interface SingleButtonProps {
  // existing props...
  pressFeedback?: PressFeedback;
}

interface SplitButtonProps {
  // existing props...
  pressFeedback?: PressFeedback;
}
```

Use keyed state:

```tsx
type XButtonPressKey = 'single' | 'main' | 'dropdown' | `menu-${number}`;

const pressMode = props.pressFeedback === false || props.pressFeedback === 'none'
  ? 'none'
  : props.pressFeedback ?? 'subtle';
const { pressedKey, flash, getPressProps } =
  usePressFeedback<XButtonPressKey>(180);
```

Suggested classes:

```ts
const xButtonPressSubtleClass =
  'translate-y-px scale-[0.98] shadow-inner';

const xButtonPressSolidClass =
  'translate-y-[2px] scale-[0.95] shadow-[inset_0_2px_4px_rgba(15,23,42,0.18)]';

const xMenuItemPressClass =
  'bg-neutral-200 text-neutral-950 dark:bg-neutral-700 dark:text-white';
```

Single button:

```tsx
const singlePressed = pressMode !== 'none' && pressedKey === 'single' && !isDisabled;

<button
  onClick={() => {
    if (!isDisabled && pressMode !== 'none') {
      flash('single');
    }
    handleButtonClick(button.onClick);
  }}
  {...(pressMode !== 'none' ? getPressProps('single') : {})}
  className={cn(
    'w-full sm:w-auto',
    minWidth,
    baseButtonClass,
    singleButtonVariantClass,
    'rounded-full',
    singlePressed && getXButtonPressClass(pressMode),
    isDisabled && disabledClass,
    className
  )}
>
```

Split main:

```tsx
const mainPressed = pressMode !== 'none' && pressedKey === 'main' && !isMainDisabled;
```

Split dropdown:

```tsx
const dropdownPressed = pressMode !== 'none' && pressedKey === 'dropdown' && !isLoading;
```

Menu items:

```tsx
const key = `menu-${index}` as const;
const itemPressed = pressMode !== 'none' && pressedKey === key && !item.disabled && !isLoading;
```

For menu items, use a lighter visual treatment. Large transforms inside a dropdown can feel jumpy, so prefer background and color changes over `translate-y`.

Important details:

- Do not apply pressed feedback while loading or disabled.
- Keep `menuOpen` behavior unchanged.
- The dropdown trigger can use solid feedback because it is a compact control.
- Menu item press feedback should not close the menu before the click flash can render. Since current code closes immediately in `onClick`, menu item flash may be invisible. Either skip menu-item flash in v1 or close with a short delay only if product wants visible menu item press feedback.

## Class Composition Rule

Avoid this pattern when pressed styles need to override background or shadow:

```tsx
cn(BASE, REST, isPressed && PRESSED)
```

If `cn` is not guaranteed to tailwind-merge every arbitrary class conflict, rest and pressed styles can override each other unpredictably.

Prefer:

```tsx
cn(BASE, isPressed ? PRESSED : REST)
```

This is why the FAQ app's date navigation buttons became reliable after splitting rest and pressed classes.

## Backward Compatibility

Expected behavior changes:

- Buttons gain visible click feedback by default.
- Disabled and loading buttons should not show press feedback.
- Existing `className`, `mainButtonClassName`, and `dropdownButtonClassName` still work.

Risk areas:

- Caller `className` can still override transform or shadow. This is acceptable, but should be documented.
- `GradientButton` link mode uses Next `Link`; ensure pointer handlers are passed to `Link`.
- `XButton` split mode has multiple targets and must not share a boolean pressed state.
- Menu item feedback may be invisible because the menu closes on click.

## Migration Strategy

1. Add `usePressFeedback` and `PressFeedback` type inside `third-ui`.
2. Add `pressFeedback?: PressFeedback` to `GradientButton` and `XButton` props.
3. Implement default `'subtle'` press feedback for `GradientButton`.
4. Implement default `'subtle'` press feedback for `XButton` single and split main/dropdown buttons.
5. Leave split menu item feedback disabled in v1, or implement background-only feedback if menu close timing is adjusted.
6. Build `third-ui` and verify generated `.d.ts` files include `pressFeedback`.
7. Run FAQ app lint/build after upgrading the local package.

## Suggested Defaults

Use these defaults unless a product screen needs stronger tactile feedback:

```tsx
<GradientButton pressFeedback="subtle" />
<XButton pressFeedback="subtle" />
```

Use strong feedback for compact utility controls:

```tsx
<XButton pressFeedback="solid" />
```

Opt out:

```tsx
<GradientButton pressFeedback="none" />
<XButton pressFeedback={false} />
```

## Test Checklist

- `GradientButton` with `onClick` shows a visible flash on light click.
- `GradientButton` with `href` shows a visible flash before navigation where possible.
- `GradientButton` disabled state has no press feedback.
- `GradientButton` loading state has no press feedback and still prevents double click.
- `XButton` single mode shows a visible flash on light click.
- `XButton` split main button and dropdown trigger maintain independent pressed states.
- `XButton` disabled/loading states do not show press feedback.
- Caller `className` still applies.
- Dark mode pressed colors remain visible.
