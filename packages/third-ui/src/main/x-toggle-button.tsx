'use client';

import * as React from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import {
  themeButtonGradientClass,
  themeButtonGradientHoverClass,
} from '@windrun-huaiin/base-ui/lib';

export type XToggleButtonOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  className?: string;
  badge?: React.ReactNode;
  mobileIcon?: React.ReactNode;
};

type XToggleButtonSize = 'default' | 'compact';

export type XToggleButtonProps = {
  options: XToggleButtonOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  inactiveItemClassName?: string;
  badgeClassName?: string;
  minItemWidthClassName?: string;
  maxItemWidthClassName?: string;
  itemTextClassName?: string;
  itemPaddingClassName?: string;
  size?: XToggleButtonSize;
  fullWidth?: boolean;
  name?: string;
  ariaLabel?: string;
};

export function XToggleButton({
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  badgeClassName,
  minItemWidthClassName,
  maxItemWidthClassName,
  itemTextClassName,
  itemPaddingClassName,
  size = 'default',
  fullWidth = false,
  name,
  ariaLabel,
}: XToggleButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeButtonRef = React.useRef<HTMLButtonElement>(null);
  const [badgeOffset, setBadgeOffset] = React.useState(0);

  const normalizedOptions = React.useMemo(
    () => options.filter((option) => option.value.trim()),
    [options]
  );

  const fallbackValue = React.useMemo(() => {
    if (defaultValue && normalizedOptions.some((option) => option.value === defaultValue)) {
      return defaultValue;
    }

    return normalizedOptions[0]?.value ?? '';
  }, [defaultValue, normalizedOptions]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(fallbackValue);

  React.useEffect(() => {
    if (!isControlled) {
      setInternalValue(fallbackValue);
    }
  }, [fallbackValue, isControlled]);

  const selectedValue = isControlled ? value ?? '' : internalValue;

  React.useEffect(() => {
    if (activeButtonRef.current && containerRef.current) {
      const buttonRect = activeButtonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonCenterX = buttonRect.left - containerRect.left + buttonRect.width / 2;
      setBadgeOffset(buttonCenterX);
    }
  }, [selectedValue]);

  function handleSelect(nextValue: string, optionDisabled?: boolean) {
    if (disabled || optionDisabled || nextValue === selectedValue) {
      return;
    }

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  }

  const containerSizeClass = size === 'compact'
    ? 'px-1.5 py-1.5 gap-0'
    : 'px-2 py-2 gap-0 sm:px-3 sm:py-3 sm:gap-0';

  const defaultItemTextClass = size === 'compact'
    ? 'text-xs'
    : 'text-xs sm:text-sm md:text-base';
  const finalItemTextClassName = itemTextClassName ?? defaultItemTextClass;

  const defaultItemPaddingClass = size === 'compact'
    ? 'px-2 py-1'
    : 'px-2 py-1.5 sm:px-3 sm:py-2';
  const finalItemPaddingClassName = itemPaddingClassName ?? defaultItemPaddingClass;

  const minItemWidthClass = minItemWidthClassName ?? 'min-w-[80px] sm:min-w-[100px] md:min-w-[120px]';
  const maxItemWidthClass = maxItemWidthClassName ?? 'max-w-[120px] sm:max-w-[160px]';

  const selectedOption = normalizedOptions.find((opt) => opt.value === selectedValue);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={cn(
        'relative inline-flex items-center rounded-full border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900',
        fullWidth && 'flex w-full',
        containerSizeClass,
        className
      )}
    >
      {selectedOption?.badge ? (
        <span
          style={{
            left: `${badgeOffset}px`,
            transform: 'translate(-50%, calc(-50% - 1px))'
          }}
          className={cn(
            'absolute top-0 z-20 whitespace-nowrap rounded-md bg-yellow-100 px-2.5 py-0.5 text-[0.625rem] font-semibold text-yellow-800 shadow-sm sm:text-xs',
            badgeClassName
          )}
        >
          {selectedOption.badge}
        </span>
      ) : null}
      {normalizedOptions.map((option) => {
        const active = option.value === selectedValue;
        const optionDisabled = disabled || option.disabled;

        return (
          <div
            key={option.value}
            className={cn('relative flex items-center justify-center', fullWidth && 'flex-1')}
          >
            <button
              ref={active ? activeButtonRef : null}
              type="button"
              role="radio"
              name={name}
              aria-checked={active}
              aria-pressed={active}
              disabled={optionDisabled}
              onClick={() => handleSelect(option.value, option.disabled)}
              className={cn(
                'relative z-10 inline-flex items-center justify-center rounded-full font-medium text-center transition truncate',
                fullWidth && 'w-full',
                !fullWidth && minItemWidthClass,
                !fullWidth && maxItemWidthClass,
                finalItemPaddingClassName,
                finalItemTextClassName,
                active
                  ? cn(
                      'text-white shadow-sm',
                      themeButtonGradientClass,
                      themeButtonGradientHoverClass,
                      activeItemClassName
                    )
                  : cn(
                      'text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100',
                      inactiveItemClassName
                    ),
                optionDisabled && 'cursor-not-allowed opacity-60',
                itemClassName,
                option.className
              )}
            >
              {option.mobileIcon ? (
                <>
                  <span className="hidden sm:block">{option.label}</span>
                  <span className="block sm:hidden">
                    {active && React.isValidElement(option.mobileIcon)
                      ? React.cloneElement(option.mobileIcon as React.ReactElement<any>, {
                          className: cn((option.mobileIcon as React.ReactElement<any>).props.className, 'text-white'),
                        })
                      : option.mobileIcon}
                  </span>
                </>
              ) : (
                option.label
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
