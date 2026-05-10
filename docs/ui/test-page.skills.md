# Test Page Skill

Use this guide when creating UI or animation test pages under `apps/ddaas/src/app/[locale]/(home)/test/*`.

## Page Shell

Test pages should occupy at least one viewport and keep a consistent top offset from the site chrome.

Recommended shell:

```tsx
const pageShellClass =
  'min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-3 py-6 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 sm:px-4 sm:py-10';

const pageInnerClass = 'mx-auto mt-12 flex w-full max-w-7xl flex-col gap-6 md:gap-8';

const panelClass =
  'rounded-[28px] border border-border/60 bg-background p-3 pb-5 shadow-sm sm:p-4 sm:pb-6 md:p-6 md:pb-8';
```

Always include a skip link for keyboard users:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
>
  Skip to content
</a>
```

## Top Control Card

The first card is the page control surface. It should contain:

- A small category badge, for example `Animate Test`, `UI Test`, or `Loading Test`.
- A clear page title.
- A single expand/fold control at the top right.
- Optional short helper text only when it materially helps the test.

Use a full-width button for the top card header so the whole header toggles:

```tsx
const [isExpanded, setIsExpanded] = useState(true);
const ToggleIcon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

<section className={cn(panelClass, 'relative overflow-hidden')}>
  <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-cyan-100/70 via-white to-fuchsia-100/60 dark:from-cyan-950/30 dark:via-neutral-950 dark:to-fuchsia-950/20" />

  <button
    type="button"
    onClick={toggleExpanded}
    className="flex w-full flex-col gap-3 text-left md:flex-row md:items-start md:justify-between"
    aria-expanded={isExpanded}
  >
    <div className="max-w-3xl">
      <div className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
        Animate Test
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Page Title
      </h1>
    </div>

    <span className="inline-flex self-start items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent md:self-auto">
      <ToggleIcon className="h-4 w-4" />
      {isExpanded ? 'Fold' : 'Expand'}
    </span>
  </button>

  {isExpanded ? <div className="mt-5 mb-4 h-px bg-border/70" /> : null}
  {isExpanded ? <div className="grid gap-6">{/* demos */}</div> : null}
</section>
```

## Fold Must Clear Animations

For animation test pages, folding the page must stop hidden animation work. Do not let collapsed demos keep consuming CPU/GPU.

When folding:

- Clear all `setTimeout` and `setInterval` handles.
- Set animation-active state to `false`.
- Reset countdown/progress UI that is tied to active animation playback.
- Prefer unmounting heavy demo sections with `{isExpanded ? ... : null}`.
- If a child component supports `paused`, pass `paused={true}` or unmount it.

Pattern:

```tsx
const playbackTimerRef = useRef<number | null>(null);
const countdownTimerRef = useRef<number | null>(null);

const stopPlaybackTimer = useCallback(() => {
  if (playbackTimerRef.current !== null) {
    window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
  }

  if (countdownTimerRef.current !== null) {
    window.clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = null;
  }
}, []);

const toggleExpanded = useCallback(() => {
  setIsExpanded((current) => {
    if (current) {
      stopPlaybackTimer();
      setActive(false);
      setRemainingSeconds(0);
    }

    return !current;
  });
}, [stopPlaybackTimer]);

useEffect(() => {
  return () => {
    stopPlaybackTimer();
  };
}, [stopPlaybackTimer]);
```

## Mobile Compatibility

Build mobile-first. The page must be usable at narrow widths.

Rules:

- Use `px-3 py-6 sm:px-4 sm:py-10` on the shell.
- Use `grid gap-*` first, then add columns at `md:` or `lg:`.
- Avoid fixed widths. Prefer `w-full`, `max-w-*`, `w-[min(100%,...)]`, and `min-w-0`.
- Controls that may overflow should wrap: `flex flex-wrap items-center gap-2 sm:gap-3`.
- Toggle groups need compact mobile widths, for example `min-w-[52px] sm:min-w-[104px]`.
- Icon buttons should keep a stable touch target, usually `h-9 w-9`.
- Text inside cards should use compact headings, not hero-scale typography.

Example comparison grid:

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <DemoCard />
  <DemoCard />
</div>
```

## Animation Controls

Use semantic icons for playback controls:

- `CirclePauseIcon` for pausing currently playing animation.
- `MonitorPlayIcon` for starting or resuming animation.
- Use `aria-label` and `title` for icon-only buttons.
- Theme-colored icons should receive the active theme color class or `themeIconColor`.

Example:

```tsx
const PlaybackIcon = active ? CirclePauseIcon : MonitorPlayIcon;

<button
  type="button"
  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent text-foreground transition hover:bg-current/10"
  aria-label={active ? 'Pause animation' : 'Play animation'}
  title={active ? 'Pause animation' : 'Play animation'}
  onClick={() => setActive((current) => !current)}
>
  <PlaybackIcon className={cn('h-6 w-6', themeIconColor)} />
</button>
```

## Verification Checklist

Before considering a test page done:

- It has `min-h-screen` shell and `mt-12` inner content offset.
- The first card has a title and expand/fold control.
- Folding stops or unmounts all running animation work.
- The page works on mobile without horizontal overflow.
- Interactive icon-only controls have `aria-label`.
- Type-check the owning app or package.
