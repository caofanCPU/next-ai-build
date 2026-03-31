'use client';

import { useRef, useState } from 'react';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeBgColor, themeBorderColor, themeIconColor, themeRingColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

type XTokenInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  maxPillWidthClassName?: string;
  size?: 'default' | 'compact';
};

function sanitizeToken(value: string): string {
  return value.replaceAll(',', '').trim();
}

function dedupeTokens(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => sanitizeToken(item)).filter(Boolean)));
}

export function XTokenInput({
  value,
  onChange,
  placeholder,
  emptyLabel,
  disabled = false,
  className,
  maxPillWidthClassName = 'max-w-[180px] sm:max-w-[220px]',
  size = 'default',
}: XTokenInputProps) {
  const [draftValue, setDraftValue] = useState('');
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tokens = dedupeTokens(value);
  const compact = size === 'compact';

  function commitToken(rawValue: string) {
    if (disabled) {
      return;
    }

    const nextValue = sanitizeToken(rawValue);
    if (!nextValue) {
      setDraftValue('');
      return;
    }

    onChange(dedupeTokens([...tokens, nextValue]));
    setDraftValue('');
  }

  function removeToken(target: string) {
    if (disabled) {
      return;
    }

    onChange(tokens.filter((item) => item !== target));
    inputRef.current?.focus();
  }

  return (
    <div className={cn('w-full min-w-0 space-y-2', className)}>
      <div
        ref={rootRef}
        onClick={() => inputRef.current?.focus()}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
            return;
          }

          commitToken(draftValue);
          setFocused(false);
        }}
        className={cn(
          'w-full min-w-0 rounded-3xl border border-black/10 transition dark:border-white/10',
          compact ? 'min-h-9 px-3 py-1.5' : 'min-h-11 px-4 py-2.5',
          focused && themeBorderColor
        )}
      >
        <div className={cn('flex w-full min-w-0 flex-wrap items-center', compact ? 'gap-1.5' : 'gap-2')}>
          {tokens.length > 0 ? (
            <ul className="contents" role="list">
              {tokens.map((token) => (
                <li key={token} className="max-w-full list-none">
                  <span
                    className={cn(
                      'inline-flex max-w-full items-center rounded-full font-semibold transition',
                      compact ? 'gap-1 px-2.5 py-0.5 text-[11px]' : 'gap-1 px-3 py-1 text-xs',
                      themeBgColor,
                      themeIconColor,
                      disabled && 'opacity-60'
                    )}
                    title={token}
                  >
                    <span className={cn('truncate', maxPillWidthClassName)}>{token}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeToken(token);
                      }}
                      disabled={disabled}
                      aria-label={`Remove ${token}`}
                      className={cn(
                        'inline-flex shrink-0 items-center justify-center rounded-full transition',
                        compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
                        'hover:bg-black/10 dark:hover:bg-white/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                        themeRingColor,
                        disabled && 'cursor-not-allowed'
                      )}
                    >
                      <icons.X className={cn(compact ? 'h-2 w-2' : 'h-2.5 w-2.5')} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div
            className={cn(
              'min-w-0 overflow-hidden',
              tokens.length === 0
                ? 'flex-1 min-w-[160px]'
                : draftValue || focused
                  ? 'flex-1 min-w-[120px]'
                  : 'w-0 flex-none'
            )}
          >
            <input
              ref={inputRef}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value.replaceAll(',', ''))}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !draftValue && tokens.length > 0) {
                  event.preventDefault();
                  removeToken(tokens[tokens.length - 1]);
                  return;
                }

                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                commitToken(draftValue);
              }}
              disabled={disabled}
              placeholder={tokens.length === 0 ? placeholder : undefined}
              className={cn(
                'bg-transparent outline-none dark:text-white',
                compact ? 'py-0 text-xs text-slate-700' : 'py-0.5 text-sm text-slate-700',
                tokens.length === 0 || draftValue || focused ? 'w-full' : 'w-0'
              )}
            />
          </div>
        </div>
      </div>
      {tokens.length === 0 && emptyLabel ? (
        <div className={cn(compact ? 'text-xs' : 'text-sm', 'text-slate-500 dark:text-slate-400')}>
          {emptyLabel}
        </div>
      ) : null}
    </div>
  );
}
