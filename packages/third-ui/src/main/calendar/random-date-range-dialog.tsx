'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  XIcon,
} from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';
import { usePressFeedback } from '../buttons/use-press-feedback';

export type RandomCalendarRange = {
  startDate: string | null;
  endDate: string | null;
};

type RandomDateRangeDialogProps = {
  open: boolean;
  value: RandomCalendarRange;
  anchorDate: string;
  defaultRangeDays?: number;
  onOpenChange: (open: boolean) => void;
  onApply: (range: RandomCalendarRange) => void;
  onClear?: (range: RandomCalendarRange) => void;
};

type QuickRangeDays = 7 | 10 | 15 | 30;
type DialogNavButtonKey = 'prevYear' | 'prevMonth' | 'nextMonth' | 'nextYear';

const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 30;
const TRACK_MIN_DAYS = 45;
const TRACK_PADDING_DAYS = 20;
const DIALOG_ICON_BUTTON_CLASS_NAME =
  'inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 transition duration-150 hover:border-black/20 hover:bg-black/5 hover:text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white';
const DIALOG_NAV_BUTTON_CLASS_NAME =
  'inline-flex h-8 w-8 items-center justify-center rounded-full transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-out';
const DIALOG_NAV_BUTTON_REST_CLASS_NAME =
  'border border-black/10 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:border-black/15 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-white/15';
const DIALOG_NAV_BUTTON_PRESSED_CLASS_NAME =
  'translate-y-[2px] scale-[0.9] border border-black/30 bg-slate-300 text-slate-950 shadow-[inset_0_2px_4px_rgba(15,23,42,0.22)] dark:border-white/25 dark:bg-white/20 dark:text-white dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.16)]';
const DIALOG_PILL_BUTTON_CLASS_NAME =
  'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-[transform,background-color,color,box-shadow] duration-100 ease-out active:scale-[0.94] active:bg-slate-300 active:text-slate-950 active:shadow-inner dark:bg-white/10 dark:text-slate-200 dark:active:scale-[0.94] dark:active:bg-white/22 dark:active:text-white sm:text-sm';
const DIALOG_PILL_BUTTON_COMPACT_CLASS_NAME =
  'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-[transform,background-color,color,box-shadow] duration-100 ease-out active:scale-[0.94] active:bg-slate-300 active:text-slate-950 active:shadow-inner dark:bg-white/10 dark:text-slate-200 dark:active:scale-[0.94] dark:active:bg-white/22 dark:active:text-white';

function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDateString(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateString(date);
}

function compareDateStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function getInclusiveDayCount(range: RandomCalendarRange): number {
  if (!range.startDate || !range.endDate) {
    return 0;
  }

  const startTime = parseDateString(range.startDate).getTime();
  const endTime = parseDateString(range.endDate).getTime();

  return Math.max(0, Math.floor((endTime - startTime) / 86400000) + 1);
}

function getRangeLabel(range: RandomCalendarRange): string {
  if (!range.startDate || !range.endDate) {
    return 'No range selected';
  }

  return `${range.startDate} ~ ${range.endDate}`;
}

function clampWindowDays(days: number): number {
  return Math.max(1, Math.min(MAX_RANGE_DAYS, Math.floor(days)));
}

function buildTrackRange(referenceDate: string, windowDays = DEFAULT_RANGE_DAYS): RandomCalendarRange {
  const resolvedWindowDays = clampWindowDays(windowDays);
  const resolvedTotalDays = Math.max(TRACK_MIN_DAYS, resolvedWindowDays + TRACK_PADDING_DAYS);
  const daysBefore = Math.floor((resolvedTotalDays - resolvedWindowDays) / 3);
  const startDate = addDays(referenceDate, -daysBefore);
  const endDate = addDays(startDate, resolvedTotalDays - 1);
  return { startDate, endDate };
}

function clampDateToRange(date: string, bounds: RandomCalendarRange): string {
  if (!bounds.startDate || !bounds.endDate) {
    return date;
  }

  if (compareDateStrings(date, bounds.startDate) < 0) {
    return bounds.startDate;
  }

  if (compareDateStrings(date, bounds.endDate) > 0) {
    return bounds.endDate;
  }

  return date;
}

function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseDateString(startDate).getTime();
  const end = parseDateString(endDate).getTime();
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function getDateByRatio(bounds: RandomCalendarRange, ratio: number): string {
  if (!bounds.startDate || !bounds.endDate) {
    return getTodayString();
  }

  const totalDays = Math.max(1, getDaysBetween(bounds.startDate, bounds.endDate));
  return addDays(bounds.startDate, Math.round(totalDays * ratio));
}

function getRatioByDate(date: string, bounds: RandomCalendarRange): number {
  if (!bounds.startDate || !bounds.endDate) {
    return 0;
  }

  const totalDays = Math.max(1, getDaysBetween(bounds.startDate, bounds.endDate));
  const distance = getDaysBetween(bounds.startDate, clampDateToRange(date, bounds));
  return distance / totalDays;
}

function formatMonthShort(value: string): string {
  return parseDateString(value).toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
}

function addMonthsClamped(value: string, months: number): string {
  const source = parseDateString(value);
  const sourceYear = source.getUTCFullYear();
  const sourceMonth = source.getUTCMonth();
  const sourceDay = source.getUTCDate();
  const targetMonthIndex = sourceMonth + months;
  const targetYear = sourceYear + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetMonthLastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(sourceDay, targetMonthLastDay);

  return formatDateString(new Date(Date.UTC(targetYear, normalizedMonth, targetDay)));
}

function getMonthStart(value: string): string {
  const date = parseDateString(value);
  return formatDateString(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

function getMonthEnd(value: string): string {
  const date = parseDateString(value);
  return formatDateString(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
}

export function RandomDateRangeDialog({
  open,
  value,
  anchorDate,
  defaultRangeDays = DEFAULT_RANGE_DAYS,
  onOpenChange,
  onApply,
  onClear,
}: RandomDateRangeDialogProps) {
  const resolvedDefaultRangeDays = clampWindowDays(defaultRangeDays);
  const [draftRange, setDraftRange] = useState<RandomCalendarRange>(value);
  const [referenceDate, setReferenceDate] = useState(anchorDate);
  const [trackBounds, setTrackBounds] = useState<RandomCalendarRange>(() => buildTrackRange(anchorDate || getTodayString(), resolvedDefaultRangeDays));
  const [windowDays, setWindowDays] = useState<number>(resolvedDefaultRangeDays);
  const {
    pressedKey: pressedNavButton,
    flash: flashNavButtonPress,
    getPressProps: getNavButtonPressProps,
  } = usePressFeedback<DialogNavButtonKey>();
  const dragStartRangeRef = useRef<RandomCalendarRange | null>(null);
  const dragModeRef = useRef<'start' | 'end' | 'window' | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const windowDragOffsetDaysRef = useRef(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const startHandleRef = useRef<HTMLButtonElement | null>(null);
  const endHandleRef = useRef<HTMLButtonElement | null>(null);
  const resultLabelRef = useRef<HTMLDivElement | null>(null);
  const selectionDaysRef = useRef<HTMLDivElement | null>(null);
  const dragPreviewRef = useRef<RandomCalendarRange | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingClientXRef = useRef<number | null>(null);
  const syncPreviewDomRef = useRef<(range: RandomCalendarRange) => void>(() => {});
  const buildDraggedRangeRef = useRef<(clientX: number) => RandomCalendarRange | null>(() => null);
  const previousBodyOverflowRef = useRef<string | null>(null);
  const today = useMemo(() => getTodayString(), []);
  const baseReferenceDate = anchorDate || today;
  const previousOpenRef = useRef(false);
  const startRatio = getRatioByDate(draftRange.startDate ?? baseReferenceDate, trackBounds);
  const endRatio = getRatioByDate(draftRange.endDate ?? baseReferenceDate, trackBounds);
  const leftPercent = Math.min(startRatio, endRatio) * 100;
  const rightPercent = Math.max(startRatio, endRatio) * 100;
  const widthPercent = Math.max(rightPercent - leftPercent, 0.5);
  const isSingleDay = (draftRange.startDate ?? null) === (draftRange.endDate ?? null);
  const startHandlePercent = isSingleDay ? Math.max(leftPercent - 0.8, 0) : leftPercent;
  const endHandlePercent = isSingleDay ? Math.min(rightPercent + 0.8, 100) : rightPercent;
  const trackTickCount = Math.max(getDaysBetween(trackBounds.startDate ?? baseReferenceDate, trackBounds.endDate ?? baseReferenceDate) + 1, 2);
  const monthLabels = useMemo(() => {
    const values = [trackBounds.startDate, trackBounds.endDate]
      .filter((item): item is string => Boolean(item))
      .map((item) => formatMonthShort(item));

    return [...new Set(values)];
  }, [trackBounds.endDate, trackBounds.startDate]);

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      const nextRange = {
        startDate: baseReferenceDate,
        endDate: addDays(baseReferenceDate, resolvedDefaultRangeDays - 1),
      };
      setDraftRange(nextRange);
      setReferenceDate(baseReferenceDate);
      setTrackBounds(buildTrackRange(baseReferenceDate, resolvedDefaultRangeDays));
      setWindowDays(resolvedDefaultRangeDays);
      dragStartRangeRef.current = null;
      dragModeRef.current = null;
      pointerIdRef.current = null;
      dragPreviewRef.current = nextRange;
    }
    previousOpenRef.current = open;
  }, [baseReferenceDate, open, resolvedDefaultRangeDays]);

  function updateRangeByReference(nextReferenceDate: string, nextWindowDays: number, options?: { preserveTrack?: boolean }) {
    const clampedWindowDays = clampWindowDays(nextWindowDays);
    const nextRange = {
      startDate: nextReferenceDate,
      endDate: addDays(nextReferenceDate, Math.max(clampedWindowDays - 1, 0)),
    };
    setReferenceDate(nextReferenceDate);
    setWindowDays(clampedWindowDays);
    setDraftRange(nextRange);
    if (!options?.preserveTrack) {
      setTrackBounds(buildTrackRange(nextReferenceDate, clampedWindowDays));
    }
  }

  const getPreviewPercents = useCallback((range: RandomCalendarRange) => {
    const start = range.startDate ?? baseReferenceDate;
    const end = range.endDate ?? start;
    const startR = getRatioByDate(start, trackBounds);
    const endR = getRatioByDate(end, trackBounds);
    const left = Math.min(startR, endR) * 100;
    const right = Math.max(startR, endR) * 100;
    const width = Math.max(right - left, 0.5);
    const single = start === end;

    return {
      left,
      right,
      width,
      startHandle: single ? Math.max(left - 0.8, 0) : left,
      endHandle: single ? Math.min(right + 0.8, 100) : right,
    };
  }, [baseReferenceDate, trackBounds]);

  const syncPreviewDom = useCallback((range: RandomCalendarRange) => {
    const percents = getPreviewPercents(range);
    if (selectionRef.current) {
      selectionRef.current.style.left = `${percents.left}%`;
      selectionRef.current.style.width = `${percents.width}%`;
    }
    if (startHandleRef.current) {
      startHandleRef.current.style.left = `${percents.startHandle}%`;
    }
    if (endHandleRef.current) {
      endHandleRef.current.style.left = `${percents.endHandle}%`;
    }
    if (resultLabelRef.current) {
      resultLabelRef.current.textContent = getRangeLabel(range);
    }
    if (selectionDaysRef.current) {
      selectionDaysRef.current.textContent = `${getInclusiveDayCount(range)}D`;
    }
  }, [getPreviewPercents]);

  useEffect(() => {
    dragPreviewRef.current = draftRange;
    syncPreviewDom(draftRange);
  }, [draftRange, syncPreviewDom]);

  function resetReferenceFromClientX(clientX: number) {
    if (!trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const nextReferenceDate = getDateByRatio(trackBounds, ratio);
    updateRangeByReference(nextReferenceDate, resolvedDefaultRangeDays, { preserveTrack: true });
  }

  function applyQuickRange(dayCount: QuickRangeDays) {
    updateRangeByReference(referenceDate, dayCount);
  }

  function shiftReferenceDateByMonths(monthOffset: number) {
    updateRangeByReference(addMonthsClamped(referenceDate, monthOffset), windowDays);
  }

  function shiftReferenceDateByYears(yearOffset: number) {
    updateRangeByReference(addMonthsClamped(referenceDate, yearOffset * 12), windowDays);
  }

  function beginDrag(mode: 'start' | 'end' | 'window', pointerId: number, clientX?: number) {
    document.body.style.userSelect = 'none';
    dragModeRef.current = mode;
    pointerIdRef.current = pointerId;
    dragStartRangeRef.current = { ...draftRange };
    dragPreviewRef.current = { ...draftRange };

    if (
      mode === 'window' &&
      clientX !== undefined &&
      trackRef.current &&
      draftRange.startDate &&
      draftRange.endDate &&
      trackBounds.startDate &&
      trackBounds.endDate
    ) {
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const pointerDate = getDateByRatio(trackBounds, ratio);
      windowDragOffsetDaysRef.current = getDaysBetween(draftRange.startDate, pointerDate);
    } else {
      windowDragOffsetDaysRef.current = 0;
    }
  }

  const buildDraggedRange = useCallback((clientX: number): RandomCalendarRange | null => {
    if (!dragModeRef.current || !dragStartRangeRef.current || !trackBounds.startDate || !trackBounds.endDate || !trackRef.current) {
      return null;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pointerDate = getDateByRatio(trackBounds, ratio);
    const currentRange = dragStartRangeRef.current;

    if (!currentRange.startDate || !currentRange.endDate) {
      return null;
    }

    if (dragModeRef.current === 'start') {
      const earliestStart = addDays(currentRange.endDate, -(MAX_RANGE_DAYS - 1));
      const boundedPointerDate = compareDateStrings(pointerDate, earliestStart) < 0 ? earliestStart : pointerDate;
      const nextStart = compareDateStrings(boundedPointerDate, currentRange.endDate) > 0 ? currentRange.endDate : boundedPointerDate;
      return { startDate: nextStart, endDate: currentRange.endDate };
    }

    if (dragModeRef.current === 'end') {
      const latestEnd = addDays(currentRange.startDate, MAX_RANGE_DAYS - 1);
      const boundedPointerDate = compareDateStrings(pointerDate, latestEnd) > 0 ? latestEnd : pointerDate;
      const nextEnd = compareDateStrings(boundedPointerDate, currentRange.startDate) < 0 ? currentRange.startDate : boundedPointerDate;
      return { startDate: currentRange.startDate, endDate: nextEnd };
    }

    const spanDays = getDaysBetween(currentRange.startDate, currentRange.endDate);
    const nextStart = clampDateToRange(addDays(pointerDate, -windowDragOffsetDaysRef.current), {
      startDate: trackBounds.startDate,
      endDate: addDays(trackBounds.endDate, -spanDays),
    });
    const nextEnd = addDays(nextStart, spanDays);
    return { startDate: nextStart, endDate: nextEnd };
  }, [trackBounds]);

  useEffect(() => {
    syncPreviewDomRef.current = syncPreviewDom;
    buildDraggedRangeRef.current = buildDraggedRange;
  }, [syncPreviewDom, buildDraggedRange]);

  function endDrag() {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingClientXRef.current = null;
    document.body.style.userSelect = '';

    const nextRange = dragPreviewRef.current;
    dragStartRangeRef.current = null;
    dragModeRef.current = null;
    pointerIdRef.current = null;
    windowDragOffsetDaysRef.current = 0;
    if (nextRange?.startDate && nextRange.endDate) {
      setDraftRange(nextRange);
      setReferenceDate(nextRange.startDate);
      setWindowDays(getInclusiveDayCount(nextRange));
    }
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleWindowPointerMove(event: PointerEvent) {
      if (dragModeRef.current === null) {
        return;
      }

      pendingClientXRef.current = event.clientX;
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingClientXRef.current === null) {
          return;
        }

        const nextRange = buildDraggedRangeRef.current(pendingClientXRef.current);
        if (nextRange) {
          dragPreviewRef.current = nextRange;
          syncPreviewDomRef.current(nextRange);
        }
      });
    }

    function handleWindowPointerUp(event: PointerEvent) {
      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
        return;
      }

      if (dragModeRef.current !== null) {
        endDrag();
      }
    }

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current ?? '';
      previousBodyOverflowRef.current = null;
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-120 flex select-none items-center justify-center bg-slate-950/60 px-3 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="space-y-5 p-4">
          <div className="relative flex items-center justify-center px-16 text-center">
            <div ref={resultLabelRef} className="select-none text-base font-semibold text-slate-900 dark:text-white">{getRangeLabel(draftRange)}</div>
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={DIALOG_ICON_BUTTON_CLASS_NAME}
                aria-label="Cancel"
              >
                <XIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draftRange);
                  onOpenChange(false);
                }}
                disabled={!draftRange.startDate || !draftRange.endDate}
                className={cn(
                  DIALOG_ICON_BUTTON_CLASS_NAME,
                  'text-slate-700 dark:text-slate-100',
                  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:bg-white disabled:hover:text-slate-700 dark:disabled:hover:border-white/10 dark:disabled:hover:bg-slate-950 dark:disabled:hover:text-slate-100'
                )}
                aria-label="Apply"
              >
                <CheckCheckIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    flashNavButtonPress('prevYear');
                    shiftReferenceDateByYears(-1);
                  }}
                  className={cn(
                    DIALOG_NAV_BUTTON_CLASS_NAME,
                    pressedNavButton === 'prevYear'
                      ? DIALOG_NAV_BUTTON_PRESSED_CLASS_NAME
                      : DIALOG_NAV_BUTTON_REST_CLASS_NAME
                  )}
                  {...getNavButtonPressProps('prevYear')}
                  aria-label="Previous year"
                  title="Previous year"
                >
                  <ChevronsLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    flashNavButtonPress('prevMonth');
                    shiftReferenceDateByMonths(-1);
                  }}
                  className={cn(
                    DIALOG_NAV_BUTTON_CLASS_NAME,
                    pressedNavButton === 'prevMonth'
                      ? DIALOG_NAV_BUTTON_PRESSED_CLASS_NAME
                      : DIALOG_NAV_BUTTON_REST_CLASS_NAME
                  )}
                  {...getNavButtonPressProps('prevMonth')}
                  aria-label="Previous month"
                  title="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextRange = {
                      startDate: baseReferenceDate,
                      endDate: addDays(baseReferenceDate, resolvedDefaultRangeDays - 1),
                    };
                    setReferenceDate(baseReferenceDate);
                    setTrackBounds(buildTrackRange(baseReferenceDate, resolvedDefaultRangeDays));
                    setWindowDays(resolvedDefaultRangeDays);
                    setDraftRange(nextRange);
                    onClear?.(nextRange);
                  }}
                  className={DIALOG_PILL_BUTTON_CLASS_NAME}
                >
                  Current Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextRange = {
                      startDate: getMonthStart(referenceDate),
                      endDate: addDays(getMonthStart(referenceDate), MAX_RANGE_DAYS - 1),
                    };
                    const clampedEndDate = compareDateStrings(nextRange.endDate, getMonthEnd(referenceDate)) > 0
                      ? getMonthEnd(referenceDate)
                      : nextRange.endDate;
                    const normalizedRange = {
                      startDate: nextRange.startDate,
                      endDate: clampedEndDate,
                    };
                    setDraftRange(normalizedRange);
                    setWindowDays(getInclusiveDayCount(normalizedRange));
                    setTrackBounds(buildTrackRange(normalizedRange.startDate, getInclusiveDayCount(normalizedRange)));
                  }}
                  className={DIALOG_PILL_BUTTON_CLASS_NAME}
                >
                  This Month
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    flashNavButtonPress('nextMonth');
                    shiftReferenceDateByMonths(1);
                  }}
                  className={cn(
                    DIALOG_NAV_BUTTON_CLASS_NAME,
                    pressedNavButton === 'nextMonth'
                      ? DIALOG_NAV_BUTTON_PRESSED_CLASS_NAME
                      : DIALOG_NAV_BUTTON_REST_CLASS_NAME
                  )}
                  {...getNavButtonPressProps('nextMonth')}
                  aria-label="Next month"
                  title="Next month"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    flashNavButtonPress('nextYear');
                    shiftReferenceDateByYears(1);
                  }}
                  className={cn(
                    DIALOG_NAV_BUTTON_CLASS_NAME,
                    pressedNavButton === 'nextYear'
                      ? DIALOG_NAV_BUTTON_PRESSED_CLASS_NAME
                      : DIALOG_NAV_BUTTON_REST_CLASS_NAME
                  )}
                  {...getNavButtonPressProps('nextYear')}
                  aria-label="Next year"
                  title="Next year"
                >
                  <ChevronsRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative h-24">
              <div className="absolute inset-x-0 top-0 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <span className="relative block select-none text-center">
                  {monthLabels[0] ?? formatMonthShort(trackBounds.startDate ?? baseReferenceDate)}
                  <span className="pointer-events-none absolute left-1/2 top-7 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="pointer-events-none absolute left-1/2 top-[1.95rem] h-9 w-0.5 -translate-x-1/2 bg-slate-400 dark:bg-slate-500" />
                </span>
                <div className="flex min-w-0 items-center justify-center gap-1">
                  {([
                    { label: '+7', days: 7 },
                    { label: '+10', days: 10 },
                    { label: '+15', days: 15 },
                    { label: '+30', days: 30 },
                  ] as const).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => applyQuickRange(item.days)}
                      className={DIALOG_PILL_BUTTON_COMPACT_CLASS_NAME}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="relative block select-none text-center">
                  {monthLabels[1] ?? formatMonthShort(trackBounds.endDate ?? baseReferenceDate)}
                  <span className="pointer-events-none absolute right-1/2 top-7 h-2.5 w-2.5 translate-x-1/2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="pointer-events-none absolute right-1/2 top-[1.95rem] h-9 w-0.5 translate-x-1/2 bg-slate-400 dark:bg-slate-500" />
                </span>
              </div>

              <div
                className="absolute inset-x-0 top-[3.35rem] h-10 touch-none"
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  resetReferenceFromClientX(event.clientX);
                }}
              >
                <div
                  ref={trackRef}
                  className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-400/30 dark:bg-slate-500/25"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 grid h-8 -translate-y-1/2 items-center"
                    style={{ gridTemplateColumns: `repeat(${trackTickCount}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: trackTickCount }, (_, index) => {
                      return (
                        <span key={index} className="flex justify-center">
                          <span
                            className={cn(
                              'rounded-full bg-slate-400/55 dark:bg-slate-500/55',
                              'h-3 w-px'
                            )}
                          />
                        </span>
                      );
                    })}
                  </div>
                  <div
                    ref={selectionRef}
                    className="absolute top-1/2 z-10 h-4 touch-none -translate-y-1/2 overflow-visible rounded-md border border-sky-500 bg-white dark:border-sky-300 dark:bg-slate-950"
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      beginDrag('window', event.pointerId, event.clientX);
                    }}
                  >
                    <div ref={selectionDaysRef} className="pointer-events-none absolute inset-0 z-30 flex select-none items-center justify-center text-xs font-semibold text-sky-700 dark:text-sky-100">
                      {`${getInclusiveDayCount(draftRange)}D`}
                    </div>
                  </div>

                  <button
                    ref={startHandleRef}
                    type="button"
                    className="absolute top-1/2 z-20 h-6 w-6 touch-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-500 bg-white shadow-sm dark:border-sky-300 dark:bg-slate-950"
                    style={{ left: `${startHandlePercent}%` }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      beginDrag('start', event.pointerId);
                    }}
                    aria-label="Adjust start date"
                  />
                  <button
                    ref={endHandleRef}
                    type="button"
                    className="absolute top-1/2 z-20 h-6 w-6 touch-none -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-500 bg-white shadow-sm dark:border-sky-300 dark:bg-slate-950"
                    style={{ left: `${endHandlePercent}%` }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      beginDrag('end', event.pointerId);
                    }}
                    aria-label="Adjust end date"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
