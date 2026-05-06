'use client';

import { useState } from 'react';
import { CalendarDaysIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import {
  type PressFeedback,
  resolvePressFeedbackMode,
  usePressFeedback,
} from '../buttons/use-press-feedback';
import { RandomDateRangeDialog, type RandomCalendarRange } from './random-date-range-dialog';

export type CalendarDateRangeValue = RandomCalendarRange;

export type CalendarDateRangeInputProps = {
  value: CalendarDateRangeValue;
  onChange: (value: CalendarDateRangeValue) => void;
  placeholder?: string;
  defaultRangeDays?: number;
  disabled?: boolean;
  className?: string;
  showDayCount?: boolean;
  dayCountUnit?: string;
  themedCalendarIcon?: boolean;
  clearPressFeedback?: PressFeedback;
  onOpenChange?: (open: boolean) => void;
};

type DateRangeInputPressKey = 'clear';

const DEFAULT_PLACEHOLDER = '滑动窗口日期';
const DEFAULT_RANGE_DAYS = 7;
const CLEAR_PRESS_FEEDBACK_MS = 180;

function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInclusiveDayCount(value: CalendarDateRangeValue): number {
  if (!value.startDate || !value.endDate) {
    return 0;
  }

  const startTime = parseDateString(value.startDate).getTime();
  const endTime = parseDateString(value.endDate).getTime();

  return Math.max(0, Math.floor(Math.abs(endTime - startTime) / 86400000) + 1);
}

function getRangeLabel(value: CalendarDateRangeValue, showDayCount: boolean, dayCountUnit: string): string | null {
  if (!value.startDate || !value.endDate) {
    return null;
  }

  const dateLabel = value.startDate === value.endDate ? value.startDate : `${value.startDate} ~ ${value.endDate}`;

  if (!showDayCount) {
    return dateLabel;
  }

  return `${dateLabel} · ${getInclusiveDayCount(value)}${dayCountUnit}`;
}

export function CalendarDateRangeInput({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  defaultRangeDays = DEFAULT_RANGE_DAYS,
  disabled = false,
  className,
  showDayCount = false,
  dayCountUnit = 'D',
  themedCalendarIcon = true,
  clearPressFeedback = 'subtle',
  onOpenChange,
}: CalendarDateRangeInputProps) {
  const [open, setOpen] = useState(false);
  const pressMode = resolvePressFeedbackMode(clearPressFeedback);
  const { pressedKey, flash, getPressProps } = usePressFeedback<DateRangeInputPressKey>(CLEAR_PRESS_FEEDBACK_MS);
  const label = getRangeLabel(value, showDayCount, dayCountUnit);
  const hasValue = Boolean(value.startDate || value.endDate);
  const isClearPressed = pressMode !== 'none' && pressedKey === 'clear' && !disabled;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function handleClear() {
    onChange({ startDate: null, endDate: null });
  }

  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            handleOpenChange(true);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpenChange(true);
          }
        }}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center rounded-2xl border border-border/70 bg-background/80 text-left text-sm shadow-sm transition hover:bg-accent/40',
          disabled && 'cursor-not-allowed opacity-60 hover:bg-background/80',
          className
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <CalendarDaysIcon
            className={cn('h-4 w-4 shrink-0', themedCalendarIcon ? themeIconColor : 'text-muted-foreground')}
          />
          <span className={cn('truncate', label ? 'text-foreground' : 'text-muted-foreground')}>
            {label ?? placeholder}
          </span>
        </span>
        <button
          type="button"
          disabled={disabled || !hasValue}
          onClick={(event) => {
            event.stopPropagation();
            if (disabled || !hasValue) {
              return;
            }

            if (pressMode !== 'none') {
              flash('clear');
            }
            handleClear();
          }}
          className={cn(
            'mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[transform,background-color,color,box-shadow]',
            hasValue
              ? 'hover:bg-black/10 hover:text-foreground dark:hover:bg-white/12'
              : 'cursor-default opacity-35',
            isClearPressed &&
              'scale-90 bg-black/15 text-foreground shadow-inner dark:bg-white/18'
          )}
          aria-label="Clear date range"
          title="Clear date range"
          {...(pressMode !== 'none' && !disabled && hasValue ? getPressProps('clear') : {})}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <RandomDateRangeDialog
        open={open}
        value={value}
        anchorDate={value.startDate ?? getTodayString()}
        defaultRangeDays={defaultRangeDays}
        onOpenChange={handleOpenChange}
        onApply={onChange}
        onClear={onChange}
      />
    </>
  );
}
