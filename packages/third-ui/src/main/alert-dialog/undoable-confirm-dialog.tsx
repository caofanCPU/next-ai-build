'use client';

import React from 'react';
import { CircleAlertIcon, Trash2Icon, Undo2Icon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@windrun-huaiin/base-ui/ui';
import { cn } from '@windrun-huaiin/lib/utils';
import {
  closeButtonClass,
  dangerButtonClass,
  dialogContentClass,
  dialogDescriptionClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogThemedOverlayClass,
  dialogTitleClass,
  secondaryButtonClass,
} from './dialog-styles';

export interface UndoableConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  pendingTitle?: React.ReactNode;
  pendingDescription?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  undoText?: string;
  countdownSeconds?: number;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  onUndo?: () => void;
}

export function UndoableConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  pendingTitle,
  pendingDescription,
  cancelText = 'Cancel',
  confirmText = 'Delete',
  undoText = 'Undo',
  countdownSeconds = 5,
  onCancel,
  onConfirm,
  onUndo,
}: UndoableConfirmDialogProps) {
  const safeCountdownSeconds = Math.max(1, Math.floor(countdownSeconds));
  const [pending, setPending] = React.useState(false);
  const [remainingSeconds, setRemainingSeconds] = React.useState(safeCountdownSeconds);
  const [confirming, setConfirming] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetState = React.useCallback(() => {
    clearTimers();
    setPending(false);
    setConfirming(false);
    setRemainingSeconds(safeCountdownSeconds);
  }, [clearTimers, safeCountdownSeconds]);

  React.useEffect(() => {
    if (open) {
      setRemainingSeconds(safeCountdownSeconds);
      return;
    }

    resetState();
  }, [open, resetState, safeCountdownSeconds]);

  React.useEffect(() => clearTimers, [clearTimers]);

  const executeConfirm = React.useCallback(async () => {
    clearTimers();
    setConfirming(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  }, [clearTimers, onConfirm, onOpenChange]);

  const startCountdown = () => {
    clearTimers();
    setPending(true);
    setRemainingSeconds(safeCountdownSeconds);

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    timeoutRef.current = window.setTimeout(() => {
      void executeConfirm();
    }, (safeCountdownSeconds + 1) * 1000);
  };

  const handleCancel = () => {
    resetState();
    onOpenChange(false);
    onCancel?.();
  };

  const handleUndo = () => {
    resetState();
    onOpenChange(false);
    onUndo?.();
  };

  const displayTitle = pending ? pendingTitle ?? title : title;
  const displayDescription = pending ? pendingDescription ?? description : description;
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        handleCancel();
        return;
      }

      onOpenChange(nextOpen);
    }}>
      <AlertDialogContent
        className={cn(dialogContentClass, 'border-red-300 dark:border-red-700')}
        overlayClassName={dialogThemedOverlayClass}
        onOverlayClick={pending ? undefined : handleCancel}
      >
        <div className={dialogHeaderClass}>
          <AlertDialogTitle asChild>
            <div className={dialogTitleClass}>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900">
                {pending ? <Trash2Icon className="size-5" /> : <CircleAlertIcon className="size-5" />}
              </span>
              <span className="min-w-0 truncate">{displayTitle}</span>
            </div>
          </AlertDialogTitle>
          <button
            type="button"
            className={closeButtonClass}
            onClick={pending ? handleUndo : handleCancel}
            aria-label="Close"
            disabled={confirming}
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <AlertDialogDescription className={cn(dialogDescriptionClass, 'min-h-[44px]')}>
          <span>{displayDescription}</span>
        </AlertDialogDescription>

        <div className="flex h-12 items-center justify-center py-1">
          <div className="flex items-baseline justify-center gap-2">
            <span className={cn('text-4xl font-black leading-none tabular-nums', pending && 'animate-bounce', themeIconColor)}>
              {pending ? remainingSeconds : safeCountdownSeconds}
            </span>
            <span className={cn('text-sm font-bold', themeIconColor)}>
              s
            </span>
          </div>
        </div>

        <div className={cn(dialogFooterClass, 'min-h-[88px] sm:min-h-10 sm:items-center')}>
          {pending ? (
            <button
              type="button"
              onClick={handleUndo}
              className={secondaryButtonClass}
              disabled={confirming}
            >
              <Undo2Icon className="mr-1.5 size-4" />
              {undoText}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className={secondaryButtonClass}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={startCountdown}
                className={dangerButtonClass}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
