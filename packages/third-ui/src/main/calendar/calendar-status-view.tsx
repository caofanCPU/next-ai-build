'use client';

import { memo, useCallback, useMemo, type ReactNode } from 'react';
import {
  CalendarHeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';
import { usePressFeedback } from '../buttons/use-press-feedback';

export type CalendarDayTone = 'saved' | 'planned' | 'warning' | 'danger' | 'neutral';

export type CalendarDayState<TStateKey extends string = string> = {
  key: TStateKey;
  title?: string;
  tone?: CalendarDayTone;
};

export type CalendarToolbarAction = {
  icon: ReactNode;
  label: string;
  title?: string;
  disabled?: boolean;
  onPress: () => void;
};

type CalendarStatusViewProps<TStateKey extends string = string> = {
  selectedDate: string;
  dayStates?: Map<string, CalendarDayState<TStateKey>>;
  action?: CalendarToolbarAction;
  className?: string;
  onSelectedDateChange: (date: string) => void;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type CalendarToolbarButtonKey = 'prevYear' | 'prevMonth' | 'today' | 'action' | 'nextMonth' | 'nextYear';

const CALENDAR_TOOLBAR_BUTTON_BASE_CLASS_NAME =
  'inline-flex h-9 w-8 items-center justify-center border transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-out sm:w-9';
const CALENDAR_TOOLBAR_BUTTON_REST_CLASS_NAME =
  'border-black/10 text-slate-700 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5';
const CALENDAR_TOOLBAR_BUTTON_PRESSED_CLASS_NAME =
  'translate-y-[2px] scale-[0.9] border-black/25 bg-black/10 text-slate-950 shadow-[inset_0_2px_4px_rgba(15,23,42,0.18)] dark:border-white/25 dark:bg-white/18 dark:text-white dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.14)]';

function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMonthParts(date: Date): { year: string; month: string } {
  return {
    year: date.toLocaleDateString('en-US', {
      year: 'numeric',
      timeZone: 'UTC',
    }),
    month: date.toLocaleDateString('en-US', {
      month: 'long',
      timeZone: 'UTC',
    }),
  };
}

function buildMonthDays(currentMonth: Date): Date[] {
  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstDay.getUTCDay();
  const gridStart = new Date(Date.UTC(year, month, 1 - startWeekday));

  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(Date.UTC(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + index))
  );
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

function getToneClassName(tone: CalendarDayTone | undefined, selected: boolean): string {
  if (selected) {
    return 'border-black/20 dark:border-white/20';
  }

  switch (tone) {
    case 'saved':
      return 'border-emerald-300 dark:border-emerald-400';
    case 'planned':
      return 'border-amber-300 dark:border-amber-400';
    case 'warning':
      return 'border-orange-300 dark:border-orange-400';
    case 'danger':
      return 'border-red-300 dark:border-red-400';
    case 'neutral':
      return 'border-slate-300 dark:border-slate-500';
    default:
      return 'border-black/10 dark:border-white/10';
  }
}

function getToneDotClassName(tone: CalendarDayTone | undefined): string {
  switch (tone) {
    case 'saved':
      return 'bg-emerald-500 dark:bg-emerald-300';
    case 'planned':
      return 'bg-amber-500 dark:bg-amber-300';
    case 'warning':
      return 'bg-orange-500 dark:bg-orange-300';
    case 'danger':
      return 'bg-red-500 dark:bg-red-300';
    case 'neutral':
      return 'bg-slate-400 dark:bg-slate-300';
    default:
      return '';
  }
}

export const CalendarStatusView = memo(function CalendarStatusView<TStateKey extends string = string>({
  selectedDate,
  dayStates,
  action,
  className,
  onSelectedDateChange,
}: CalendarStatusViewProps<TStateKey>) {
  const calendarMonth = useMemo(() => parseDateString(`${selectedDate.slice(0, 7)}-01`), [selectedDate]);
  const monthTitle = useMemo(() => getMonthParts(calendarMonth), [calendarMonth]);
  const monthDays = useMemo(() => buildMonthDays(calendarMonth), [calendarMonth]);
  const today = useMemo(() => getTodayString(), []);
  const {
    pressedKey: pressedToolbarButton,
    flash: flashToolbarButtonPress,
    getPressProps: getToolbarButtonPressProps,
  } = usePressFeedback<CalendarToolbarButtonKey>();

  function getToolbarButtonClassName(button: CalendarToolbarButtonKey, shapeClassName: string) {
    return cn(
      CALENDAR_TOOLBAR_BUTTON_BASE_CLASS_NAME,
      shapeClassName,
      pressedToolbarButton === button
        ? CALENDAR_TOOLBAR_BUTTON_PRESSED_CLASS_NAME
        : CALENDAR_TOOLBAR_BUTTON_REST_CLASS_NAME,
      button === 'action' && action?.disabled ? 'pointer-events-none opacity-45' : ''
    );
  }

  const handlePreviousYear = useCallback(() => {
    onSelectedDateChange(addMonthsClamped(selectedDate, -12));
  }, [onSelectedDateChange, selectedDate]);
  const handlePreviousMonth = useCallback(() => {
    onSelectedDateChange(addMonthsClamped(selectedDate, -1));
  }, [onSelectedDateChange, selectedDate]);
  const handleSelectToday = useCallback(() => {
    onSelectedDateChange(today);
  }, [onSelectedDateChange, today]);
  const handleNextMonth = useCallback(() => {
    onSelectedDateChange(addMonthsClamped(selectedDate, 1));
  }, [onSelectedDateChange, selectedDate]);
  const handleNextYear = useCallback(() => {
    onSelectedDateChange(addMonthsClamped(selectedDate, 12));
  }, [onSelectedDateChange, selectedDate]);
  const handleDayPress = useCallback(
    (nextDate: string) => {
      onSelectedDateChange(nextDate);
    },
    [onSelectedDateChange]
  );

  return (
    <div
      className={cn(
        'flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-black/10 p-3 dark:border-white/10 sm:p-4 xl:self-stretch',
        className
      )}
    >
      <div className="flex h-full flex-col space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => {
                flashToolbarButtonPress('prevYear');
                handlePreviousYear();
              }}
              className={getToolbarButtonClassName('prevYear', 'rounded-l-full')}
              {...getToolbarButtonPressProps('prevYear')}
              aria-label="Previous year"
              title="Previous year"
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                flashToolbarButtonPress('prevMonth');
                handlePreviousMonth();
              }}
              className={getToolbarButtonClassName('prevMonth', '-ml-px')}
              {...getToolbarButtonPressProps('prevMonth')}
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                flashToolbarButtonPress('today');
                handleSelectToday();
              }}
              className={getToolbarButtonClassName('today', '-ml-px rounded-r-full')}
              {...getToolbarButtonPressProps('today')}
              aria-label="Select today"
              title="Select today"
            >
              <CalendarHeartIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1 px-2 text-center">
            <div className="text-[11px] font-semibold leading-none text-slate-500 dark:text-slate-400 sm:text-xs">
              {monthTitle.year}
            </div>
            <div className="mt-1 truncate text-sm font-semibold leading-none text-slate-900 dark:text-white">
              {monthTitle.month}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {action ? (
              <button
                type="button"
                onClick={() => {
                  if (action.disabled) {
                    return;
                  }

                  flashToolbarButtonPress('action');
                  action.onPress();
                }}
                className={getToolbarButtonClassName('action', 'rounded-l-full')}
                {...getToolbarButtonPressProps('action')}
                aria-label={action.label}
                title={action.title ?? action.label}
                disabled={action.disabled}
              >
                {action.icon}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                flashToolbarButtonPress('nextMonth');
                handleNextMonth();
              }}
              className={getToolbarButtonClassName('nextMonth', action ? '-ml-px' : 'rounded-l-full')}
              {...getToolbarButtonPressProps('nextMonth')}
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                flashToolbarButtonPress('nextYear');
                handleNextYear();
              }}
              className={getToolbarButtonClassName('nextYear', '-ml-px rounded-r-full')}
              {...getToolbarButtonPressProps('nextYear')}
              aria-label="Next year"
              title="Next year"
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const date = formatDateString(day);
            const state = dayStates?.get(date);

            return (
              <CalendarDayButton
                key={date}
                date={date}
                label={String(day.getUTCDate())}
                currentMonth={day.getUTCMonth() === calendarMonth.getUTCMonth()}
                selected={date === selectedDate}
                dayState={state}
                onPress={handleDayPress}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

const CalendarDayButton = memo(function CalendarDayButton({
  date,
  label,
  currentMonth,
  selected,
  dayState,
  onPress,
}: {
  date: string;
  label: string;
  currentMonth: boolean;
  selected: boolean;
  dayState?: CalendarDayState;
  onPress: (date: string) => void;
}) {
  const tone = dayState?.tone;

  return (
    <button
      type="button"
      onClick={() => onPress(date)}
      className={cn(
        'relative flex h-11 select-none items-center justify-center rounded-2xl border text-sm transition',
        selected
          ? 'bg-black text-white dark:bg-white dark:text-slate-950'
          : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/5',
        getToneClassName(tone, selected),
        currentMonth ? '' : 'opacity-45'
      )}
      title={dayState?.title ?? `Open ${date}`}
    >
      <span>{label}</span>
      {tone ? (
        <span className={cn('absolute bottom-1 h-1.5 w-1.5 rounded-full', getToneDotClassName(tone))} />
      ) : null}
    </button>
  );
});
