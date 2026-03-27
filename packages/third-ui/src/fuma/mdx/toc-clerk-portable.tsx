'use client';

import * as Primitive from 'fumadocs-core/toc';
import {
  PageTOC,
  PageTOCPopover,
  PageTOCPopoverContent,
  PageTOCPopoverTrigger,
  PageTOCTitle,
} from 'fumadocs-ui/layouts/docs/page';
import {
  type ComponentProps,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  themeIconColor,
  themeSvgIconColor,
} from '@windrun-huaiin/base-ui/lib';

type TOCItemType = Primitive.TOCItemType;

type PortableClerkTOCProps = {
  toc: TOCItemType[];
  header?: ReactNode;
  footer?: ReactNode;
  title?: ReactNode;
  emptyLabel?: ReactNode;
  className?: string;
};

type ClerkItemMeta = {
  item: TOCItemType;
  resolvedContent: ReactNode;
  stepNumber: string | null;
  itemPadding: number;
  lineOffset: number;
};

type ClerkItemMeasure = {
  url: string;
  y: number;
  x: number;
  stepNumber: string | null;
};

const CLERK_PATH_STROKE_WIDTH = 1.5;
const CLERK_ACTIVE_DOT_RADIUS = 2.15;
const CLERK_TURN_CURVE_HEIGHT = 12;
const CLERK_TURN_CONTROL_FACTOR = 0.68;
const CLERK_TURN_GAP_MARGIN = 7;

export function PortableClerkTOC({
  toc,
  header,
  footer,
  title,
  emptyLabel = 'No headings',
  className,
}: PortableClerkTOCProps) {
  return (
    <PageTOC className={className}>
      {header}
      {title ?? <PageTOCTitle />}
      <PortableClerkTOCScrollArea>
        <PortableClerkTOCItems toc={toc} emptyLabel={emptyLabel} />
      </PortableClerkTOCScrollArea>
      {footer}
    </PageTOC>
  );
}

export function PortableClerkTOCPopover({
  toc,
  header,
  footer,
  emptyLabel = 'No headings',
}: Omit<PortableClerkTOCProps, 'title' | 'className'>) {
  return (
    <PageTOCPopover>
      <PageTOCPopoverTrigger />
      <PageTOCPopoverContent>
        {header}
        <PortableClerkTOCScrollArea>
          <PortableClerkTOCItems toc={toc} emptyLabel={emptyLabel} />
        </PortableClerkTOCScrollArea>
        {footer}
      </PageTOCPopoverContent>
    </PageTOCPopover>
  );
}

export function PortableClerkTOCScrollArea({
  ref,
  className,
  ...props
}: ComponentProps<'div'>) {
  const viewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={mergeRefs(viewRef, ref)}
      className={cn(
        'relative min-h-0 text-sm ms-px overflow-auto [scrollbar-width:none] mask-[linear-gradient(to_bottom,transparent,white_16px,white_calc(100%-16px),transparent)] py-3',
        className,
      )}
      {...props}
    >
      <Primitive.ScrollProvider containerRef={viewRef}>
        {props.children}
      </Primitive.ScrollProvider>
    </div>
  );
}

export function PortableClerkTOCItems({
  toc,
  emptyLabel = 'No headings',
  ref,
  className,
  ...props
}: ComponentProps<'div'> & { toc: TOCItemType[]; emptyLabel?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeAnchors = Primitive.useActiveAnchors();
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const contentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [layout, setLayout] = useState<{
    height: number;
    items: ClerkItemMeasure[];
  }>({
    height: 0,
    items: [],
  });

  const metas = useMemo(() => toc.map(resolveClerkItem), [toc]);
  const outlinePath = useMemo(
    () => buildOutlinePath(layout.items),
    [layout.items],
  );
  const activeItems = useMemo(
    () => getActiveItems(layout.items, activeAnchors),
    [activeAnchors, layout.items],
  );
  const activePath = useMemo(() => buildOutlinePath(activeItems), [activeItems]);
  const activeEndpoint = useMemo(
    () => getActiveEndpoint(activeItems),
    [activeItems],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const updateLayout = () => {
      frame = 0;
      const nextItems = metas.flatMap((meta, index) => {
        const element = itemRefs.current[index];
        const content = contentRefs.current[index];
        if (!element || !content) return [];

        const y = measureItemLineY(element, content);

        return [
          {
            url: meta.item.url,
            y,
            x: meta.lineOffset,
            stepNumber: meta.stepNumber,
          },
        ];
      });

      setLayout((prev) => {
        const next = {
          height: container.clientHeight,
          items: nextItems,
        };

        if (isSameLayout(prev, next)) return prev;
        return next;
      });
    };

    const queueUpdate = () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateLayout);
    };

    queueUpdate();

    const observer = new ResizeObserver(queueUpdate);
    observer.observe(container);

    for (const element of itemRefs.current) {
      if (element) observer.observe(element);
    }

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [metas]);

  if (toc.length === 0) {
    return (
      <div className="rounded-lg border bg-fd-card p-3 text-xs text-fd-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      ref={mergeRefs(containerRef, ref)}
      className={cn('relative flex flex-col', className)}
      {...props}
    >
      <ClerkOutline
        path={outlinePath}
        items={layout.items}
        activePath={activePath}
        activeAnchors={activeAnchors}
        activeEndpoint={activeEndpoint}
      />
      {metas.map((meta, i) => (
        <PortableClerkTOCItem
          key={meta.item.url}
          item={meta.item}
          isActive={activeAnchors.includes(meta.item.url.slice(1))}
          resolvedContent={meta.resolvedContent}
          itemPadding={meta.itemPadding}
          contentRef={(node: HTMLSpanElement | null) => {
            contentRefs.current[i] = node;
          }}
          ref={(node: HTMLAnchorElement | null) => {
            itemRefs.current[i] = node;
          }}
        />
      ))}
    </div>
  );
}

function PortableClerkTOCItem({
  item,
  isActive,
  resolvedContent,
  itemPadding,
  contentRef,
  ref,
}: {
  item: TOCItemType;
  isActive: boolean;
  resolvedContent: ReactNode;
  itemPadding: number;
  contentRef?: ((node: HTMLSpanElement | null) => void) | null;
  ref?: ((node: HTMLAnchorElement | null) => void) | null;
}) {
  return (
    <Primitive.TOCItem
      ref={ref}
      href={item.url}
      data-clerk-item=""
      style={{
        paddingInlineStart: itemPadding,
      }}
      className={cn(
        'prose group relative py-1.5 text-sm transition-colors wrap-anywhere first:pt-0 last:pb-0 hover:text-fd-accent-foreground',
        isActive ? themeIconColor : 'text-fd-muted-foreground',
      )}
    >
      <span ref={contentRef} className="relative z-10">
        {resolvedContent}
      </span>
    </Primitive.TOCItem>
  );
}

function ClerkOutline({
  path,
  items,
  activePath,
  activeAnchors,
  activeEndpoint,
}: {
  path: string;
  items: ClerkItemMeasure[];
  activePath: string;
  activeAnchors: string[];
  activeEndpoint: { x: number; y: number } | null;
}) {
  if (!path) return null;

  const activeSet = new Set(activeAnchors);

  return (
    <>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-visible"
        width="100%"
        height="100%"
      >
        <path
          d={path}
          className="stroke-fd-foreground/15"
          fill="none"
          strokeWidth={CLERK_PATH_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-visible"
        width="100%"
        height="100%"
      >
        {activePath ? (
          <path
            d={activePath}
            fill="none"
            strokeWidth={CLERK_PATH_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke={themeSvgIconColor}
          />
        ) : null}
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-visible"
        width="100%"
        height="100%"
      >
        {activeEndpoint ? (
          <circle
            cx={activeEndpoint.x}
            cy={activeEndpoint.y}
            r={CLERK_ACTIVE_DOT_RADIUS}
            fill={themeSvgIconColor}
          />
        ) : null}
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1 overflow-visible"
        width="100%"
        height="100%"
      >
        {items.map((item) => {
          if (!item.stepNumber) return null;

          const isActive = activeSet.has(item.url.slice(1));

          return (
            <g key={item.url} transform={`translate(${item.x}, ${item.y})`}>
              <circle
                r="7"
                fill={isActive ? themeSvgIconColor : undefined}
                className={cn(!isActive && 'fill-black dark:fill-white')}
              />
              <text
                y="0.5"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[9px] font-medium dark:fill-black"
              >
                {item.stepNumber}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

function getItemOffset(depth: number): number {
  if (depth <= 2) return 14;
  if (depth === 3) return 26;
  return 36;
}

function getLineOffset(depth: number): number {
  return depth >= 3 ? 18 : 6;
}

function getVisualLinePosition(depth: number): number {
  return getLineOffset(depth);
}

function resolveClerkItem(item: TOCItemType): ClerkItemMeta {
  const isH3 = item.depth === 3;
  const rawTitle = typeof item.title === 'string' ? item.title : '';
  const { isStep, displayStep, content } = getStepInfoFromTitle(rawTitle);
  let stepNumber: string | null = isH3 && isStep ? String(displayStep) : null;
  let resolvedContent: ReactNode = item.title;

  if (isH3 && isStep) {
    resolvedContent = content ?? item.title;
  }

  if (isH3 && !stepNumber) {
    const urlNum = getDigitsFromUrl(item.url);
    if (urlNum != null) {
      const clamped = Math.max(0, Math.min(19, urlNum));
      stepNumber = String(clamped);
      if (typeof rawTitle === 'string') {
        const match = rawTitle.match(/^(\d+(?:\.\d+)*\.?)\s+(.+)$/);
        if (match?.[2]) {
          resolvedContent = match[2];
        }
      }
    }
  }

  return {
    item,
    resolvedContent,
    stepNumber,
    itemPadding: getItemOffset(item.depth),
    lineOffset: getVisualLinePosition(item.depth),
  };
}

function buildOutlinePath(items: ClerkItemMeasure[]): string {
  if (items.length === 0) return '';

  const [first] = items;
  const last = items.at(-1);
  if (!last) return '';

  let path = `M ${round(first.x)} ${round(first.y)}`;

  for (let i = 1; i < items.length; i++) {
    path += ` ${buildTurnSegment(items[i - 1], items[i])}`;
  }

  return path;
}

function buildTurnSegment(
  previous: ClerkItemMeasure,
  current: ClerkItemMeasure,
): string {
  if (Math.abs(previous.x - current.x) <= 0.5) {
    return `L ${round(current.x)} ${round(current.y)}`;
  }

  const distanceY = current.y - previous.y;
  if (distanceY <= 0) {
    return `L ${round(current.x)} ${round(current.y)}`;
  }

  const gapMidY = previous.y + distanceY / 2;
  const maxCurveHeight = Math.max(distanceY - CLERK_TURN_GAP_MARGIN * 2, 0);
  const curveHeight = Math.min(
    CLERK_TURN_CURVE_HEIGHT,
    Math.max(maxCurveHeight, 0),
  );
  if (curveHeight <= 0.5) {
    return `L ${round(current.x)} ${round(current.y)}`;
  }

  const turnStartY = gapMidY - curveHeight / 2;
  const turnEndY = gapMidY + curveHeight / 2;
  const controlDelta = curveHeight * CLERK_TURN_CONTROL_FACTOR;

  return [
    `L ${round(previous.x)} ${round(turnStartY)}`,
    `C ${round(previous.x)} ${round(turnStartY + controlDelta)} ${round(
      current.x,
    )} ${round(turnEndY - controlDelta)} ${round(current.x)} ${round(
      turnEndY,
    )}`,
    `L ${round(current.x)} ${round(current.y)}`,
  ].join(' ');
}

function getActiveItems(
  items: ClerkItemMeasure[],
  activeAnchors: string[],
): ClerkItemMeasure[] {
  if (items.length === 0 || activeAnchors.length === 0) return [];

  return items.filter((item) => activeAnchors.includes(item.url.slice(1)));
}

function getActiveEndpoint(
  items: ClerkItemMeasure[],
): { x: number; y: number } | null {
  if (items.length === 0) return null;

  const last = items.at(-1);
  if (!last) return null;

  return {
    x: last.x,
    y: last.y,
  };
}

function isSameLayout(
  previous: { height: number; items: ClerkItemMeasure[] },
  next: { height: number; items: ClerkItemMeasure[] },
): boolean {
  if (Math.abs(previous.height - next.height) > 0.5) return false;
  if (previous.items.length !== next.items.length) return false;

  for (let i = 0; i < previous.items.length; i++) {
    const prev = previous.items[i];
    const curr = next.items[i];
    if (!prev || !curr) return false;
    if (prev.url !== curr.url || prev.stepNumber !== curr.stepNumber) {
      return false;
    }
    if (Math.abs(prev.y - curr.y) > 0.5) return false;
    if (Math.abs(prev.x - curr.x) > 0.5) return false;
  }

  return true;
}

function measureItemLineY(
  element: HTMLAnchorElement,
  content: HTMLSpanElement,
): number {
  const anchorRect = element.getBoundingClientRect();
  const lineRects = Array.from(content.getClientRects()).filter(
    (rect) => rect.height > 0,
  );

  if (lineRects.length > 0) {
    const lastRect = lineRects.at(-1);
    if (lastRect) {
      return (
        element.offsetTop +
        (lastRect.top - anchorRect.top) +
        lastRect.height / 2
      );
    }
  }

  const styles = getComputedStyle(element);
  const top = element.offsetTop + parseFloat(styles.paddingTop);
  const bottom =
    element.offsetTop +
    element.clientHeight -
    parseFloat(styles.paddingBottom);
  return (top + bottom) / 2;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function getDigitsFromUrl(url: string): number | null {
  const match = /^#(\d+)-/.exec(url);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? null : value;
}

function getStepInfoFromTitle(title: string): {
  isStep: boolean;
  displayStep: number | null;
  content: string | null;
} {
  const trimmed = title.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)*\.?)\s+(.+)$/);
  if (!match) return { isStep: false, displayStep: null, content: null };

  const content = (match[2] ?? '').trim();
  if (content.length === 0) {
    return { isStep: false, displayStep: null, content: null };
  }

  const numericPart = match[1].replace(/\.$/, '');
  const parts = numericPart.split('.').map((part) => Number.parseInt(part, 10));
  const lastPart = parts.at(-1);
  if (lastPart == null || Number.isNaN(lastPart)) {
    return { isStep: false, displayStep: null, content: null };
  }

  const clamped = Math.max(0, Math.min(19, lastPart));
  return { isStep: true, displayStep: clamped, content };
}

function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}

function mergeRefs<T>(
  ...refs: Array<
    React.Ref<T> | ((instance: T | null) => void) | null | undefined
  >
) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
        continue;
      }

      try {
        (ref as React.MutableRefObject<T | null>).current = node;
      } catch {
        // ignore readonly refs
      }
    }
  };
}

/**
 * Portable Clerk TOC notes
 *
 * 1. This file is meant to be copied into an application project instead of
 * relying on fumadocs-ui internal aliases like `@/components/layout/toc`.
 *
 * 2. Public package imports only:
 * - `fumadocs-core/toc`
 * - `fumadocs-ui/layouts/docs/page`
 *
 * 3. Non-public helper dependencies are intentionally inlined here:
 * - `cn`
 * - `mergeRefs`
 *
 * 4. Usage model:
 * - pass `toc={page.data.toc}` directly
 * - inject into `DocsPage` with `tableOfContent.component`
 * - inject the mobile version with `tableOfContentPopover.component`
 *
 * 5. This component still depends on `DocsPage` providing the surrounding
 * `AnchorProvider`. If you render it outside `DocsPage`, wrap it with
 * `Primitive.AnchorProvider` yourself.
 */
