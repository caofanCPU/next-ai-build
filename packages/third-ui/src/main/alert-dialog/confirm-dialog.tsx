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

export type ConfirmDialogType = 'normal' | 'danger';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: ConfirmDialogType;
  title: React.ReactNode;
  description: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
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
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const typeClass = confirmTypeClassMap[type];
  const Icon = typeClass.Icon;

  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(dialogContentClass, typeClass.content)}
        overlayClassName={dialogThemedOverlayClass}
        onOverlayClick={handleCancel}
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
            onClick={handleCancel}
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <AlertDialogDescription className={dialogDescriptionClass}>
          {description}
        </AlertDialogDescription>

        <div className={dialogFooterClass}>
          <AlertDialogCancel className={secondaryButtonClass} onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={typeClass.action}
            onClick={() => {
              onOpenChange(false);
              onConfirm?.();
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
