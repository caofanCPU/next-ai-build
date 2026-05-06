'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Loading } from '../loading';

export type DialogLoadingAction = 'cancel' | 'confirm' | 'undo';
export type DialogActionHandler = () => void | Promise<void>;

interface UseDialogLoadingActionOptions {
  loadingActions?: readonly DialogLoadingAction[];
  onOpenChange: (open: boolean) => void;
}

export function useDialogLoadingAction({
  loadingActions,
  onOpenChange,
}: UseDialogLoadingActionOptions) {
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const runDialogAction = React.useCallback(async (
    action: DialogLoadingAction,
    handler?: DialogActionHandler
  ) => {
    onOpenChange(false);

    if (!handler) {
      return;
    }

    if (!loadingActions?.includes(action)) {
      await handler();
      return;
    }

    setLoading(true);

    try {
      await handler();
    } finally {
      setLoading(false);
    }
  }, [loadingActions, onOpenChange]);

  const dialogLoading = mounted && loading
    ? createPortal(
      <div className="fixed inset-0 z-10000">
        <Loading className="h-full w-full" />
      </div>,
      document.body
    )
    : null;

  return {
    dialogLoading,
    runDialogAction,
  };
}
