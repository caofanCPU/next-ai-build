'use client';

import React from 'react';
import {
  BadgeAlertIcon,
  BadgeCheckIcon,
  BadgeInfoIcon,
  BadgeXIcon,
  XIcon,
} from '@windrun-huaiin/base-ui/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@windrun-huaiin/base-ui/ui';
import { cn } from '@windrun-huaiin/lib/utils';
import {
  closeButtonClass,
  dialogContentClass,
  dialogDescriptionClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogThemedOverlayClass,
  dialogTitleClass,
} from './dialog-styles';

export type InfoDialogType = 'info' | 'warn' | 'success' | 'error';
type InfoDialogIcon = typeof BadgeInfoIcon;

interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: InfoDialogType;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
}

const infoTypeClassMap: Record<InfoDialogType, {
  content: string;
  iconWrap: string;
  icon: string;
  action: string;
  Icon: InfoDialogIcon;
}> = {
  info: {
    content: 'border-sky-300 dark:border-sky-700',
    iconWrap: 'bg-sky-100 text-sky-600 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900',
    icon: 'text-sky-600 dark:text-sky-300',
    action: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400',
    Icon: BadgeInfoIcon,
  },
  warn: {
    content: 'border-amber-300 dark:border-amber-700',
    iconWrap: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    icon: 'text-amber-700 dark:text-amber-300',
    action: 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400',
    Icon: BadgeAlertIcon,
  },
  success: {
    content: 'border-emerald-300 dark:border-emerald-700',
    iconWrap: 'bg-emerald-100 text-emerald-600 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
    icon: 'text-emerald-600 dark:text-emerald-300',
    action: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400',
    Icon: BadgeCheckIcon,
  },
  error: {
    content: 'border-red-300 dark:border-red-700',
    iconWrap: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
    icon: 'text-red-600 dark:text-red-300',
    action: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500',
    Icon: BadgeXIcon,
  },
};

export function InfoDialog({
  open,
  onOpenChange,
  type = 'info',
  title,
  description,
  confirmText = 'OK',
  onConfirm,
}: InfoDialogProps) {
  const typeClass = infoTypeClassMap[type];
  const Icon = typeClass.Icon;
  const handleClose = () => onOpenChange(false);

  return (
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
          <AlertDialogAction
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60',
              typeClass.action
            )}
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
