'use client';

import React from 'react';
import { CircleAlertIcon, CircleQuestionMarkIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
import { themeBgColor, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
  primaryButtonClass,
  secondaryButtonClass,
} from './dialog-styles';
import { DialogLoadingAction, DialogActionHandler, useDialogLoadingAction } from './dialog-loading-action';

export type ConfirmDialogType = 'normal' | 'danger';
export type ConfirmDialogEmphasis = 'confirm' | 'cancel';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: ConfirmDialogType;
  title: React.ReactNode;
  description: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  emphasis?: ConfirmDialogEmphasis;
  loadingActions?: readonly DialogLoadingAction[];
  loadingFullPage?: boolean;
  onCancel?: DialogActionHandler;
  onConfirm?: DialogActionHandler;
}

const confirmTypeClassMap: Record<ConfirmDialogType, {
  content: string;
  iconWrap: string;
  icon: string;
  action: string;
  Icon: typeof CircleQuestionMarkIcon;
}> = {
  normal: {
    content: '',
    iconWrap: cn(themeBgColor, 'ring-0'),
    icon: themeIconColor,
    action: primaryButtonClass,
    Icon: CircleQuestionMarkIcon,
  },
  danger: {
    content: 'border-red-300 dark:border-red-700',
    iconWrap: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
    icon: 'text-red-600 dark:text-red-300',
    action: dangerButtonClass,
    Icon: CircleAlertIcon,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  type = 'normal',
  title,
  description,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  emphasis = 'confirm',
  loadingActions,
  loadingFullPage,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const typeClass = confirmTypeClassMap[type];
  const Icon = typeClass.Icon;
  const cancelButtonClass = emphasis === 'cancel' ? typeClass.action : secondaryButtonClass;
  const confirmButtonClass = emphasis === 'cancel' ? secondaryButtonClass : typeClass.action;
  const { dialogLoading, runDialogAction } = useDialogLoadingAction({ loadingActions, loadingFullPage, onOpenChange });

  const handleCancel = () => {
    void runDialogAction('cancel', onCancel);
  };
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent
          className={cn(dialogContentClass, typeClass.content)}
          overlayClassName={dialogThemedOverlayClass}
          onOverlayClick={handleClose}
        >
          <div className={dialogHeaderClass}>
            <AlertDialogTitle asChild>
              <div className={dialogTitleClass}>
                <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-1', typeClass.iconWrap)}>
                  <Icon className={cn('size-5', typeClass.icon)} />
                </span>
                <span className="min-w-0 truncate">{title}</span>
              </div>
            </AlertDialogTitle>
            <button
              type="button"
              className={closeButtonClass}
              onClick={handleClose}
              aria-label="Close"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <AlertDialogDescription className={dialogDescriptionClass}>
            {description}
          </AlertDialogDescription>

          <div className={dialogFooterClass}>
            <AlertDialogCancel className={cancelButtonClass} onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              className={confirmButtonClass}
              onClick={() => {
                void runDialogAction('confirm', onConfirm);
              }}
            >
              {confirmText}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {dialogLoading}
    </>
  );
}
