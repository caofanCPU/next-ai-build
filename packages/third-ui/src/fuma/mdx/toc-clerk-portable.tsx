'use client';

/**
 * References most of its code and SVG animation design from
 * https://github.com/fuma-nama/fumadocs/blob/dev/packages/radix-ui/src/components/toc/clerk.tsx
 */
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
  useEffect,
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
  fullTitle: string | null;
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

// Base stroke width for both the inactive rail and the active highlight path.
const CLERK_PATH_STROKE_WIDTH = 1;
// Radius of the moving endpoint dot that marks the latest active heading.
const CLERK_ACTIVE_DOT_RADIUS = 2;
// Max vertical space reserved for a turn inside the gap between two headings.
const CLERK_TURN_CURVE_HEIGHT = 12;
// Multiplier for bezier control points; higher values make the turn rounder.
const CLERK_TURN_CONTROL_FACTOR = 0.68;
// Safety margin that keeps turns away from the heading rows themselves.
const CLERK_TURN_GAP_MARGIN = 7;
// Shared duration for active rail fade transitions and endpoint dot movement.
const CLERK_ACTIVE_ANIMATION_DURATION_MS = 300;
// Easing curve for the active rail and dot; tuned for a slightly delayed, softer motion.
const CLERK_ACTIVE_ANIMATION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Horizontal gap between the path centerline and the heading text start.
const CLERK_TEXT_GAP_FROM_PATH = 12;
// Radius of numbered step badges rendered on top of the path centerline.
const CLERK_STEP_BADGE_RADIUS = 7;
// Max number of characters rendered for a TOC label before trimming with ellipsis.
const CLERK_MAX_LABEL_LENGTH = 44;

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
          fullTitle={meta.fullTitle}
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
  fullTitle,
  itemPadding,
  contentRef,
  ref,
}: {
  item: TOCItemType;
  isActive: boolean;
  resolvedContent: ReactNode;
  fullTitle: string | null;
  itemPadding: number;
  contentRef?: ((node: HTMLSpanElement | null) => void) | null;
  ref?: ((node: HTMLAnchorElement | null) => void) | null;
}) {
  return (
    <Primitive.TOCItem
      ref={ref}
      href={item.url}
      data-clerk-item=""
      title={fullTitle ?? undefined}
      style={{
        paddingInlineStart: itemPadding,
      }}
      className={cn(
        'prose group relative py-1.5 text-sm transition-colors first:pt-0 last:pb-0 hover:text-fd-accent-foreground',
        isActive ? themeIconColor : 'text-fd-muted-foreground',
      )}
    >
      <span
        ref={contentRef}
        className="relative z-10 block overflow-hidden text-ellipsis whitespace-nowrap"
      >
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
  const activeSet = new Set(activeAnchors);
  const [displayPath, setDisplayPath] = useState(activePath);
  const [fadingPath, setFadingPath] = useState<string | null>(null);

  useEffect(() => {
    if (activePath === displayPath) return;
    if (!displayPath) {
      setDisplayPath(activePath);
      setFadingPath(null);
      return;
    }

    setFadingPath(displayPath);
    setDisplayPath(activePath);

    const timeout = window.setTimeout(() => {
      setFadingPath(null);
    }, CLERK_ACTIVE_ANIMATION_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [activePath, displayPath]);

  const dotTranslate = activeEndpoint
    ? `translate(${activeEndpoint.x - CLERK_ACTIVE_DOT_RADIUS}px, ${
        activeEndpoint.y - CLERK_ACTIVE_DOT_RADIUS
      }px)`
    : undefined;
  const transitionStyle = {
    transitionDuration: `${CLERK_ACTIVE_ANIMATION_DURATION_MS}ms`,
    transitionTimingFunction: CLERK_ACTIVE_ANIMATION_EASING,
  };

  if (!path) return null;

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
        {fadingPath ? (
          <path
            d={fadingPath}
            fill="none"
            strokeWidth={CLERK_PATH_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke={themeSvgIconColor}
            className="transition-opacity"
            style={{
              opacity: 0,
              ...transitionStyle,
            }}
          />
        ) : null}
        {displayPath ? (
          <path
            d={displayPath}
            fill="none"
            strokeWidth={CLERK_PATH_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke={themeSvgIconColor}
            className="transition-opacity"
            style={{
              opacity: 1,
              ...transitionStyle,
            }}
          />
        ) : null}
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute rounded-full transition-transform"
          style={{
            width: CLERK_ACTIVE_DOT_RADIUS * 2,
            height: CLERK_ACTIVE_DOT_RADIUS * 2,
            backgroundColor: themeSvgIconColor,
            transform: dotTranslate,
            opacity: activeEndpoint ? 1 : 0,
            ...transitionStyle,
          }}
        />
      </div>
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
                r={CLERK_STEP_BADGE_RADIUS}
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
  const lineOffset = getLineOffset(depth);
  const badgeRadius = depth === 3 ? CLERK_STEP_BADGE_RADIUS : 0;
  return lineOffset + badgeRadius + CLERK_TEXT_GAP_FROM_PATH;
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
  let fullTitle: string | null = rawTitle || null;

  if (isH3 && isStep) {
    resolvedContent = content ?? item.title;
    if (typeof content === 'string') {
      fullTitle = content;
    }
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
          fullTitle = match[2];
        }
      }
    }
  }

  if (typeof resolvedContent === 'string') {
    fullTitle = resolvedContent;
    resolvedContent = truncateClerkLabel(resolvedContent);
  }

  return {
    item,
    resolvedContent,
    fullTitle,
    stepNumber,
    itemPadding: getItemOffset(item.depth),
    lineOffset: getVisualLinePosition(item.depth),
  };
}

function truncateClerkLabel(value: string): string {
  const normalized = value.trim();
  if (normalized.length <= CLERK_MAX_LABEL_LENGTH) return normalized;

  return `${normalized.slice(0, CLERK_MAX_LABEL_LENGTH).trimEnd()}...`;
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
        (ref as React.RefObject<T | null>).current = node;
      } catch {
        // ignore readonly refs
      }
    }
  };
}
