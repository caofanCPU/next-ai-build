'use client';

import { DownloadIcon, MmdIcon, RefreshCcwIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
// Attention: do not use external dialog library, avoid react context conflict when building third-party applications
import type { MermaidConfig } from 'mermaid';
import { cn } from '@windrun-huaiin/lib/utils';
import { useTheme } from 'next-themes';
import rough from 'roughjs';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { themeIconColor, themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';

function sanitizeFilename(name: string) {
  return name
    .replace(/[\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

interface MermaidProps {
  chart: string;
  title?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  handDrawn?: boolean;
  /**
   * enable preview dialog by clicking the chart, default is true
   */
  enablePreview?: boolean;
}
 
export function Mermaid({ chart, title, watermarkEnabled, watermarkText, handDrawn = true, enablePreview = true }: MermaidProps) {
  const id = useId();
  const [svg, setSvg] = useState('');
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  // zoom & pan states for preview dialog
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const startTranslateRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  
  useEffect(() => {
    let isMounted = true;
    void renderChart();
 
    async function renderChart() {
      const mermaidConfig: MermaidConfig = {
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeCSS: 'margin: 1.5rem auto 0;',
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      };
 
      const { default: mermaid } = await import('mermaid');
 
      try {
        mermaid.initialize(mermaidConfig);
        const { svg } = await mermaid.render(
          id.replaceAll(':', ''),
          chart.replaceAll('\\n', '\n')
        );
        let svgWithWatermark = handDrawn ? applyHandDrawnStyle(svg) : svg;
        if (watermarkEnabled && watermarkText) {
          svgWithWatermark = addWatermarkToSvg(svgWithWatermark, watermarkText, themeSvgIconColor);
        }
        if (isMounted) setSvg(svgWithWatermark);
      } catch (error) {
        console.error('Error while rendering mermaid', error);
      }
    }
    return () => {
      isMounted = false;
      setSvg('');
    };
  }, [chart, id, resolvedTheme, watermarkEnabled, watermarkText, handDrawn]);

  // helpers for preview zoom
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const resetTransform = useCallback(() => {
    setScale(4); // 400%
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    // zoom by center: keep the zoom center at the center of the canvas, without introducing displacement
    setScale((prev) => clamp(prev + delta, 0.25, 10));
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Cmd/Ctrl + wheel zoom (around the center point), otherwise up and down panning
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => clamp(prev + delta, 0.25, 10));
    } else {
      // two-finger pan on touchpad: support both horizontal (deltaX) and vertical (deltaY)
      e.preventDefault();
      e.stopPropagation();
      setTranslate((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointersRef.current.size === 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      pinchStartDistanceRef.current = Math.hypot(second.x - first.x, second.y - first.y);
      pinchStartScaleRef.current = scale;
      isPanningRef.current = false;
    } else {
    isPanningRef.current = true;
    startPointRef.current = { x: e.clientX, y: e.clientY };
    startTranslateRef.current = { ...translate };
    }
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, [scale, translate]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const [first, second] = Array.from(activePointersRef.current.values());
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      if (pinchStartDistanceRef.current > 0) {
        setScale(clamp((distance / pinchStartDistanceRef.current) * pinchStartScaleRef.current, 0.25, 10));
      }
      return;
    }

    if (!isPanningRef.current) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    setTranslate({ x: startTranslateRef.current.x + dx, y: startTranslateRef.current.y + dy });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    isPanningRef.current = false;
    if (activePointersRef.current.size === 1) {
      const remaining = Array.from(activePointersRef.current.values())[0];
      startPointRef.current = remaining;
      startTranslateRef.current = { ...translate };
      isPanningRef.current = true;
    }
    if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    }
  }, [translate]);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    isPanningRef.current = false;
    if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!svg) return;
    const fileName = `${sanitizeFilename(title ?? 'mermaid')}.svg`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [svg, title]);

  // prevent browser-level zoom (touchpad pinch/shortcut) from taking effect when the dialog is open
  useEffect(() => {
    if (!open) return;
    // 初次打开时，默认放大到 400%
    resetTransform();
    const onGlobalWheel = (ev: WheelEvent) => {
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault();
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      const k = ev.key;
      if (k === '=' || k === '+') {
        ev.preventDefault();
        setScale((prev) => clamp(prev + 0.2, 0.25, 10));
      } else if (k === '-') {
        ev.preventDefault();
        setScale((prev) => clamp(prev - 0.2, 0.25, 10));
      } else if (k === '0') {
        ev.preventDefault();
        resetTransform();
      }
    };
    window.addEventListener('wheel', onGlobalWheel, { passive: false, capture: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('wheel', onGlobalWheel, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, resetTransform]);

  // Lock background scroll when dialog is open
  useEffect(() => {
    if (!open) return;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);
 
  return (
    <div>
      <div
        className={enablePreview ? 'group relative cursor-zoom-in' : undefined}
        onClick={() => enablePreview && svg && setOpen(true)}
      >
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        {enablePreview && svg && (
          <div className="pointer-events-none absolute right-2 top-2 hidden rounded bg-black/50 px-2 py-0.5 text-[12px] text-white group-hover:block">
            Preview Chart
          </div>
        )}
      </div>
      {title && (
        <div
          className={cn("mt-2 flex items-center justify-center text-center text-[13px] font-italic", themeIconColor)}
        >
          <MmdIcon className='mr-1 h-4 w-4' />
          <span>{title}</span>
        </div>
      )}

      {/* Preview Dialog (custom minimal dialog) */}
      {enablePreview && open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Mermaid Preview'}
          className="fixed inset-0 z-9999 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => { setOpen(false); resetTransform(); }}
            onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
          />
          <div className="relative z-1 max-w-[95vw] w-[95vw] h-[88vh] p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-2xl overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <div className={cn("min-w-0 flex items-center gap-2 text-sm", themeIconColor)}>
                <MmdIcon className="h-4 w-4" />
                <span className="truncate max-w-[50vw]">{title ?? 'Mermaid Preview'}</span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  aria-label="Zoom out"
                  className="hidden h-6 w-6 items-center justify-center rounded border border-neutral-300 text-[13px] transition-colors hover:bg-neutral-100 active:bg-neutral-200 hover:border-neutral-400 active:border-neutral-500 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:hover:border-neutral-500 dark:active:border-neutral-400 sm:flex"
                  onClick={() => zoomBy(-0.5)}
                >
                  －
                </button>
                <span className="mx-0.5 w-12 text-center text-[12px] select-none">{Math.round(scale * 100)}%</span>
                <button
                  aria-label="Zoom in"
                  className="hidden h-6 w-6 items-center justify-center rounded border border-neutral-300 text-[13px] transition-colors hover:bg-neutral-100 active:bg-neutral-200 hover:border-neutral-400 active:border-neutral-500 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:hover:border-neutral-500 dark:active:border-neutral-400 sm:flex"
                  onClick={() => zoomBy(0.5)}
                >
                  ＋
                </button>
                {/* quick zoom shortcuts */}
                <div className="mx-1 hidden h-4 w-px bg-neutral-300 dark:bg-neutral-700 sm:block" />
                <button
                  aria-label="Zoom 100%"
                  className="hidden h-6 min-w-8 items-center justify-center rounded border border-neutral-300 px-1.5 text-[12px] transition-colors hover:bg-neutral-100 active:bg-neutral-200 hover:border-neutral-400 active:border-neutral-500 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:hover:border-neutral-500 dark:active:border-neutral-400 sm:inline-flex"
                  onClick={() => setScale(1)}
                >
                  X1
                </button>
                <button
                  aria-label="Zoom 200%"
                  className="ml-1 hidden h-6 min-w-8 items-center justify-center rounded border border-neutral-300 px-1.5 text-[12px] transition-colors hover:bg-neutral-100 active:bg-neutral-200 hover:border-neutral-400 active:border-neutral-500 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:hover:border-neutral-500 dark:active:border-neutral-400 sm:inline-flex"
                  onClick={() => setScale(2)}
                >
                  X2
                </button>
                <button
                  aria-label="Zoom 300%"
                  className="ml-1 hidden h-6 min-w-8 items-center justify-center rounded border border-neutral-300 px-1.5 text-[12px] transition-colors hover:bg-neutral-100 active:bg-neutral-200 hover:border-neutral-400 active:border-neutral-500 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:hover:border-neutral-500 dark:active:border-neutral-400 sm:inline-flex"
                  onClick={() => setScale(3)}
                >
                  X3
                </button>
                <button
                  aria-label="Zoom 1000%"
                  className="ml-1 hidden h-6 min-w-10 items-center justify-center rounded border border-neutral-300 px-1.5 text-[12px] transition-colors hover:bg-neutral-100 active:bg-neutral-200 hover:border-neutral-400 active:border-neutral-500 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 dark:hover:border-neutral-500 dark:active:border-neutral-400 sm:inline-flex"
                  onClick={() => setScale(10)}
                >
                  X10
                </button>
                <button
                  aria-label="Reset"
                  className={cn("ml-1 flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-700 dark:active:bg-neutral-600", themeIconColor)}
                  onClick={resetTransform}
                >
                  <RefreshCcwIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Download SVG"
                  className={cn("ml-1 flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-700 dark:active:bg-neutral-600", themeIconColor)}
                  onClick={handleDownload}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Close"
                  className={cn("ml-1 flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-700 dark:active:bg-neutral-600", themeIconColor)}
                  onClick={() => { setOpen(false); resetTransform(); }}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div
              className="relative h-[calc(88vh-40px)] w-full overflow-hidden bg-white dark:bg-neutral-900 overscroll-contain touch-none"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              <div
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) translate(${translate.x}px, ${translate.y}px)` }}
              >
                <div
                  style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
              <div className="absolute inset-x-3 bottom-3 rounded-md bg-white/92 px-3 py-2 shadow-sm backdrop-blur sm:hidden dark:bg-neutral-900/92">
                <label className="mb-1 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-300">
                  <span>Zoom</span>
                  <span>{Math.round(scale * 100)}%</span>
                </label>
                <input
                  aria-label="Zoom slider"
                  className="block w-full"
                  type="range"
                  min="25"
                  max="1000"
                  step="5"
                  value={Math.round(scale * 100)}
                  style={{ accentColor: themeSvgIconColor }}
                  onChange={(e) => setScale(clamp(Number(e.target.value) / 100, 0.25, 10))}
                />
              </div>
              {/* helper text */}
              <div className="pointer-events-none absolute bottom-2 right-3 hidden rounded bg-black/40 px-2 py-1 text-xs text-white sm:block">
                Drag to pan, click button to zoom-out or zoom-in
              </div>
              <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-[11px] text-white sm:hidden">
                Drag to pan, pinch to zoom-out or zoom-in
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function addWatermarkToSvg(svg: string, watermark: string, watermarkColor: string) {
  const watermarkText = `
    <text
      x="100%"
      y="98%"
      text-anchor="end"
      font-size="12"
      font-style="italic"
      fill="${watermarkColor}"
      opacity="0.40"
      class="pointer-events-none"
      dx="-8"
      dy="-4"
    >${watermark}</text>
  `;
  return svg.replace('</svg>', `${watermarkText}</svg>`);
}

function applyHandDrawnStyle(svg: string) {
  if (typeof window === 'undefined') return svg;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.documentElement;
    if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') return svg;

    const rc = rough.svg(svgElement as unknown as SVGSVGElement);
    const serializer = new XMLSerializer();
    const getNumber = (value: string | null) => Number.parseFloat(value ?? '') || 0;
    const getStyleValue = (element: Element, name: string) => {
      const inlineStyle = element.getAttribute('style');
      if (inlineStyle) {
        const match = inlineStyle.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`));
        if (match?.[1]) return match[1].trim();
      }
      return element.getAttribute(name);
    };
    const applyAttributes = (source: Element, target: Element) => {
      for (const attr of source.getAttributeNames()) {
        if (attr === 'x' || attr === 'y' || attr === 'x1' || attr === 'y1' || attr === 'x2' || attr === 'y2' || attr === 'width' || attr === 'height' || attr === 'rx' || attr === 'ry' || attr === 'points' || attr === 'd') continue;
        target.setAttribute(attr, source.getAttribute(attr) ?? '');
      }
    };
    const createOptions = (element: Element) => {
      const stroke = getStyleValue(element, 'stroke') ?? '#000';
      const fill = getStyleValue(element, 'fill') ?? 'none';
      const strokeWidth = getNumber(getStyleValue(element, 'stroke-width')) || 1.5;
      return {
        stroke,
        fill: fill === 'none' ? undefined : fill,
        strokeWidth,
        roughness: 1.6,
        bowing: 1.25,
        fillStyle: fill === 'none' ? 'hachure' : 'solid',
        fillWeight: 0.8,
        hachureGap: 10,
        preserveVertices: true,
        seed: 7,
      };
    };
    const replaceShape = (element: Element, node: SVGElement | SVGGElement | null) => {
      if (!node || !element.parentNode) return;
      applyAttributes(element, node);
      if (element.getAttribute('class')) {
        node.setAttribute('class', element.getAttribute('class') ?? '');
      }
      if (element.getAttribute('style')) {
        node.setAttribute('style', element.getAttribute('style') ?? '');
      }
      element.parentNode.replaceChild(node, element);
    };

    svgElement.querySelectorAll('rect').forEach((element) => {
      const x = getNumber(element.getAttribute('x'));
      const y = getNumber(element.getAttribute('y'));
      const width = getNumber(element.getAttribute('width'));
      const height = getNumber(element.getAttribute('height'));
      const rx = getNumber(element.getAttribute('rx'));
      const ry = getNumber(element.getAttribute('ry'));
      const node = rx > 0 || ry > 0
        ? rc.path(
            `M ${x + rx} ${y}
             H ${x + width - rx}
             Q ${x + width} ${y} ${x + width} ${y + ry}
             V ${y + height - ry}
             Q ${x + width} ${y + height} ${x + width - rx} ${y + height}
             H ${x + rx}
             Q ${x} ${y + height} ${x} ${y + height - ry}
             V ${y + ry}
             Q ${x} ${y} ${x + rx} ${y}
             Z`,
            createOptions(element)
          )
        : rc.rectangle(
            x,
            y,
            width,
            height,
            createOptions(element)
          );
      replaceShape(element, node);
    });

    svgElement.querySelectorAll('line').forEach((element) => {
      const node = rc.line(
        getNumber(element.getAttribute('x1')),
        getNumber(element.getAttribute('y1')),
        getNumber(element.getAttribute('x2')),
        getNumber(element.getAttribute('y2')),
        createOptions(element)
      );
      replaceShape(element, node);
    });

    svgElement.querySelectorAll('polyline').forEach((element) => {
      const points = (element.getAttribute('points') ?? '')
        .trim()
        .split(/\s+/)
        .map((pair) => pair.split(',').map(Number))
        .filter((point) => point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])) as [number, number][];
      if (points.length < 2) return;
      const node = rc.linearPath(points, createOptions(element));
      replaceShape(element, node);
    });

    svgElement.querySelectorAll('polygon').forEach((element) => {
      const points = (element.getAttribute('points') ?? '')
        .trim()
        .split(/\s+/)
        .map((pair) => pair.split(',').map(Number))
        .filter((point) => point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])) as [number, number][];
      if (points.length < 2) return;
      const node = rc.polygon(points, createOptions(element));
      replaceShape(element, node);
    });

    svgElement.querySelectorAll('path').forEach((element) => {
      const d = element.getAttribute('d');
      if (!d) return;
      const node = rc.path(d, createOptions(element));
      replaceShape(element, node);
    });

    return serializer.serializeToString(svgElement);
  } catch (error) {
    console.error('Error while applying hand-drawn mermaid style', error);
    return svg;
  }
}
