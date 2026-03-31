'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeBgColor, themeBorderColor, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

export type XPillOption = {
  label: string;
  value: string;
};

type XPillSelectBaseProps = {
  options?: XPillOption[];
  disabled?: boolean;
  className?: string;
  pillClassName?: string;
  emptyLabel?: string;
  maxPillWidthClassName?: string;
  size?: 'default' | 'compact';
  inputEnabled?: boolean;
  inputPlaceholder?: string;
  onInputTransform?: (value: string) => string;
  allSelectedLabel?: string;
  maxVisiblePills?: number;
};

type XPillSelectSingleProps = XPillSelectBaseProps & {
  mode: 'single';
  value: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
};

type XPillSelectMultipleProps = XPillSelectBaseProps & {
  mode: 'multiple';
  value: string[];
  onChange: (value: string[]) => void;
  allowClear?: boolean;
};

export type XPillSelectProps = XPillSelectSingleProps | XPillSelectMultipleProps;

function sanitizeInputValue(value: string): string {
  return value.replaceAll(',', '').trim();
}

function dedupeValues(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

export function XPillSelect(props: XPillSelectProps) {
  const {
    options = [],
    disabled = false,
    className,
    pillClassName,
    emptyLabel,
    maxPillWidthClassName = 'max-w-[180px] sm:max-w-[220px]',
    size = 'default',
    inputEnabled = false,
    inputPlaceholder,
    onInputTransform,
    allSelectedLabel,
    maxVisiblePills,
  } = props;

  const [draftValue, setDraftValue] = useState('');
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const compact = size === 'compact';

  const normalizedOptions = useMemo(
    () => options.map((option) => ({ ...option, value: option.value.trim() })).filter((option) => option.value),
    [options]
  );

  const selectedValues = props.mode === 'single' ? (props.value ? [props.value] : []) : dedupeValues(props.value);
  const allOptionValues = normalizedOptions.map((option) => option.value);
  const isAllSelected =
    props.mode === 'multiple' &&
    allOptionValues.length > 0 &&
    allOptionValues.every((value) => selectedValues.includes(value));
  const aggregatedSelectedLabel = isAllSelected ? allSelectedLabel?.trim() || '全部' : null;
  const hasVisiblePillLimit = props.mode === 'multiple' && typeof maxVisiblePills === 'number' && maxVisiblePills >= 0;
  const visibleSelectedValues =
    aggregatedSelectedLabel || !hasVisiblePillLimit
      ? selectedValues
      : selectedValues.slice(0, maxVisiblePills);
  const hiddenSelectedCount =
    aggregatedSelectedLabel || !hasVisiblePillLimit
      ? 0
      : Math.max(selectedValues.length - visibleSelectedValues.length, 0);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handlePointerDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  function isSelected(optionValue: string) {
    return selectedValues.includes(optionValue);
  }

  function commitInputValue(rawValue: string) {
    if (!inputEnabled || disabled) {
      return;
    }

    const nextValue = sanitizeInputValue(onInputTransform ? onInputTransform(rawValue) : rawValue);

    if (!nextValue) {
      setDraftValue('');
      return;
    }

    if (props.mode === 'single') {
      props.onChange(nextValue);
    } else {
      props.onChange(dedupeValues([...selectedValues, nextValue]));
    }

    setDraftValue('');
  }

  function toggleValue(nextValue: string) {
    if (disabled) {
      return;
    }

    if (props.mode === 'single') {
      if (props.allowClear && props.value === nextValue) {
        props.onChange('');
        setOpen(false);
        return;
      }

      props.onChange(nextValue);
      setOpen(false);
      return;
    }

    if (selectedValues.includes(nextValue)) {
      props.onChange(selectedValues.filter((item) => item !== nextValue));
      return;
    }

    props.onChange([...selectedValues, nextValue]);
  }

  function removeValue(nextValue: string) {
    if (disabled) {
      return;
    }

    if (props.mode === 'single') {
      props.onChange('');
      return;
    }

    props.onChange(selectedValues.filter((item) => item !== nextValue));
  }

  function clearAllSelectedValues() {
    if (disabled || props.mode !== 'multiple') {
      return;
    }

    props.onChange([]);
  }

  function toggleOpen() {
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }

          event.preventDefault();
          toggleOpen();
        }}
        className={cn(
          'flex w-full items-center justify-between rounded-full border border-black/10 text-left transition dark:border-white/10',
          compact ? 'min-h-9 gap-2 px-3 py-1.5' : 'min-h-11 gap-3 px-4 py-2.5',
          !disabled && 'cursor-pointer',
          !disabled && (hovered || open) && themeBorderColor,
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {selectedValues.length > 0 ? (
            aggregatedSelectedLabel ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clearAllSelectedValues();
                }}
                disabled={disabled}
                className={cn(
                  'inline-flex max-w-full items-center rounded-full font-semibold transition',
                  compact ? 'gap-1 px-2.5 py-0.5 text-[11px]' : 'gap-1.5 px-3 py-1 text-xs',
                  themeBgColor,
                  themeIconColor,
                  'hover:brightness-95 dark:hover:brightness-110',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
                title={aggregatedSelectedLabel}
              >
                <span className={cn('truncate', maxPillWidthClassName)}>{aggregatedSelectedLabel}</span>
              </button>
            ) : (
              <>
                {visibleSelectedValues.map((selectedValue) => {
                  const optionLabel = normalizedOptions.find((option) => option.value === selectedValue)?.label ?? selectedValue;

                  return (
                    <button
                      key={selectedValue}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeValue(selectedValue);
                      }}
                      disabled={disabled}
                      className={cn(
                        'inline-flex max-w-full items-center rounded-full font-semibold transition',
                        compact ? 'gap-1 px-2.5 py-0.5 text-[11px]' : 'gap-1.5 px-3 py-1 text-xs',
                        themeBgColor,
                        themeIconColor,
                        'hover:brightness-95 dark:hover:brightness-110',
                        disabled && 'cursor-not-allowed opacity-60'
                      )}
                      title={optionLabel}
                    >
                      <span className={cn('truncate', maxPillWidthClassName)}>{optionLabel}</span>
                    </button>
                  );
                })}
                {hiddenSelectedCount > 0 ? (
                  <span
                    className={cn(
                      'inline-flex max-w-full items-center rounded-full font-semibold transition',
                      compact ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
                      'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-white'
                    )}
                    title={`还有 ${hiddenSelectedCount} 项未展开`}
                  >
                    +{hiddenSelectedCount}
                  </span>
                ) : null}
              </>
            )
          ) : (
            <span className={cn(compact ? 'text-xs' : 'text-sm', 'text-slate-500 dark:text-slate-400')}>
              {emptyLabel}
            </span>
          )}
        </div>
        <icons.ChevronDown
          className={cn(
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
            'shrink-0 text-slate-500 transition-transform dark:text-slate-400',
            open && 'rotate-180'
          )}
        />
      </div>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable={props.mode === 'multiple' ? true : undefined}
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 rounded-3xl border border-black/10 bg-neutral-100 shadow-xl dark:border-white/10 dark:bg-neutral-900',
            compact ? 'space-y-2.5 p-3' : 'space-y-3 p-4',
            open && themeBorderColor
          )}
        >
          {inputEnabled ? (
            <input
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value.replaceAll(',', ''))}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                commitInputValue(draftValue);
              }}
              disabled={disabled}
              placeholder={inputPlaceholder}
              className={cn(
                'w-full rounded-full border border-black/10 text-slate-700 outline-none transition focus:border-purple-400 dark:border-white/10 dark:text-white',
                compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
              )}
            />
          ) : null}

          {normalizedOptions.length > 0 ? (
            <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
              {normalizedOptions.map((option) => {
                const active = isSelected(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    disabled={disabled}
                    className={cn(
                      'inline-flex items-center justify-center rounded-full border font-semibold transition-colors',
                      compact ? 'px-3 py-1 text-[11px]' : 'px-4 py-2 text-xs',
                      'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700',
                      active &&
                        [themeBgColor, themeBorderColor, themeIconColor],
                      disabled && 'cursor-not-allowed opacity-60',
                      pillClassName
                    )}
                    title={option.label}
                  >
                    <span className={cn('truncate', maxPillWidthClassName)}>{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
