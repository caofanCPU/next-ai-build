'use client';

import { useState } from 'react';

export type PressFeedbackKey = string;
export type PressFeedbackMode = 'none' | 'subtle' | 'solid';
export type PressFeedback = boolean | PressFeedbackMode;

export interface PressFeedbackProps<T extends PressFeedbackKey> {
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onBlur: () => void;
}

export function resolvePressFeedbackMode(pressFeedback?: PressFeedback): PressFeedbackMode {
  if (pressFeedback === false || pressFeedback === 'none') {
    return 'none';
  }

  if (pressFeedback === 'solid') {
    return 'solid';
  }

  return 'subtle';
}

export function usePressFeedback<T extends PressFeedbackKey>(durationMs = 180) {
  const [pressedKey, setPressedKey] = useState<T | null>(null);

  function release(key: T) {
    setPressedKey((current) => (current === key ? null : current));
  }

  function trigger(key: T) {
    setPressedKey(key);
  }

  function flash(key: T) {
    setPressedKey(key);
    window.setTimeout(() => {
      setPressedKey((current) => (current === key ? null : current));
    }, durationMs);
  }

  function getPressProps(key: T): PressFeedbackProps<T> {
    return {
      onPointerDown: () => trigger(key),
      onPointerUp: () => release(key),
      onPointerLeave: () => release(key),
      onPointerCancel: () => release(key),
      onBlur: () => release(key),
    };
  }

  return { pressedKey, trigger, release, flash, getPressProps };
}
