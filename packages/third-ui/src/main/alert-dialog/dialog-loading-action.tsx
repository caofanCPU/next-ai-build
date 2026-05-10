'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Loading } from '../loading';
import { dialogLoadingContentClass } from './dialog-styles';

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
    if (!handler) {
      onOpenChange(false);
      return;
    }

    if (!loadingActions?.includes(action)) {
      onOpenChange(false);
      await handler();
      return;
    }

    setLoading(true);
    onOpenChange(false);

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
        <div className="fixed inset-0 z-10000">
          <div className={dialogLoadingContentClass}>
            <Loading
              compact
              label="Loading"
              className="min-h-[220px] w-full rounded-none bg-transparent px-0 py-0 dark:bg-transparent"
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
