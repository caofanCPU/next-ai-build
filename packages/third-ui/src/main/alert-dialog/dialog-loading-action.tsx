'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Loading } from '../loading';

export type DialogLoadingAction = 'cancel' | 'confirm' | 'undo';
export type DialogActionHandler = () => void | Promise<void>;

interface UseDialogLoadingActionOptions {
  loadingActions?: readonly DialogLoadingAction[];
  loadingFullPage?: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useDialogLoadingAction({
  loadingActions,
  loadingFullPage = false,
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
      loadingFullPage ? (
        <div className="fixed inset-0 z-10000">
          <Loading className="h-full w-full" />
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-10000 flex items-center justify-center p-4">
          <div className="pointer-events-auto overflow-hidden rounded-[28px] bg-neutral-50/58 shadow-[0_18px_56px_rgba(15,23,42,0.14)] backdrop-blur-md dark:bg-neutral-900/58 dark:shadow-[0_18px_56px_rgba(0,0,0,0.34)]">
            <Loading
              compact
              label="Loading"
              className="min-h-[250px] w-[min(22rem,calc(100vw-2rem))] bg-transparent"
              labelClassName="text-foreground"
            />
          </div>
        </div>
      ),
      document.body
    )
    : null;

  return {
    dialogLoading,
    runDialogAction,
  };
}
