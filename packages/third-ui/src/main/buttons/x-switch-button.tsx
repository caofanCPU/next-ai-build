'use client';

import * as React from 'react';
import {
  themeButtonGradientClass,
  themeButtonGradientHoverClass,
  themeIconColor,
} from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

export type XSwitchButtonSize = 'default' | 'compact';

export type XSwitchButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'value' | 'defaultValue' | 'children'
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  checkedLabel?: React.ReactNode;
  uncheckedLabel?: React.ReactNode;
  labelPosition?: 'left' | 'right';
  size?: XSwitchButtonSize;
  className?: string;
  labelClassName?: string;
  trackClassName?: string;
  thumbClassName?: string;
  checkedClassName?: string;
  uncheckedClassName?: string;
  checkedTrackClassName?: string;
  uncheckedTrackClassName?: string;
  checkedThumbClassName?: string;
  uncheckedThumbClassName?: string;
};

export function XSwitchButton({
  checked,
  defaultChecked = false,
  onCheckedChange,
  checkedLabel,
  uncheckedLabel,
  labelPosition = 'left',
  size = 'default',
  className,
  labelClassName,
  trackClassName,
  thumbClassName,
  checkedClassName,
  uncheckedClassName,
  checkedTrackClassName,
  uncheckedTrackClassName,
  checkedThumbClassName,
  uncheckedThumbClassName,
  disabled,
  type = 'button',
  onClick,
  ...props
}: XSwitchButtonProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const active = isControlled ? checked : internalChecked;
  const currentLabel = active ? checkedLabel : uncheckedLabel;
  const hasLabel = currentLabel !== undefined && currentLabel !== null && currentLabel !== false;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented || disabled) {
      return;
    }

    const nextChecked = !active;

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onCheckedChange?.(nextChecked);
  }

  const trackSizeClass = size === 'compact' ? 'h-5 w-9' : 'h-6 w-11';
  const thumbSizeClass = size === 'compact' ? 'size-4' : 'size-5';
  const thumbTranslateClass = active
    ? size === 'compact'
      ? 'translate-x-4'
      : 'translate-x-5'
    : 'translate-x-0.5';

  const labelNode = hasLabel ? (
    <span className={cn('min-w-0', labelClassName)}>
      {currentLabel}
    </span>
  ) : null;

  const defaultCheckedClassName = cn(
    'border-transparent text-white shadow-sm',
    themeButtonGradientClass,
    themeButtonGradientHoverClass
  );
  const defaultUncheckedClassName = cn(
    'border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:border-current hover:bg-slate-50',
    'dark:border-white/20 dark:bg-slate-900/90 dark:text-slate-200 dark:shadow-white/5 dark:hover:bg-slate-800',
    themeIconColor
  );

  const trackNode = (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors',
        trackSizeClass,
        active ? 'bg-white/25' : 'bg-slate-300 dark:bg-slate-700',
        trackClassName,
        active ? checkedTrackClassName : uncheckedTrackClassName
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-sm transition-transform dark:bg-slate-100',
          thumbSizeClass,
          thumbTranslateClass,
          thumbClassName,
          active ? checkedThumbClassName : uncheckedThumbClassName
        )}
      />
    </span>
  );

  return (
    <button
      type={type}
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200',
        active ? defaultCheckedClassName : defaultUncheckedClassName,
        className,
        active
          ? checkedClassName
          : uncheckedClassName,
        disabled && 'cursor-not-allowed opacity-60'
      )}
      {...props}
    >
      {labelPosition === 'left' ? (
        <>
          {labelNode}
          {trackNode}
        </>
      ) : (
        <>
          {trackNode}
          {labelNode}
        </>
      )}
    </button>
  );
}
