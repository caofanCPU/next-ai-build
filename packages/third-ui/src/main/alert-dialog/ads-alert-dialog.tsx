'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BellIcon, ImageOffIcon, XIcon } from '@windrun-huaiin/base-ui/icons';
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
  primaryButtonClass,
  secondaryButtonClass,
  subtlePrimaryButtonClass,
} from './dialog-styles';

interface AdsAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  imgSrc?: string;
  imgHref?: string;
  onCancel?: () => void;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export function AdsAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  imgSrc,
  imgHref,
  cancelText,
  onCancel,
  confirmText,
  onConfirm,
}: AdsAlertDialogProps) {
  const [imgError, setImgError] = useState(false);
  const handleClose = () => onOpenChange(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(dialogContentClass, 'max-w-md p-4')}
        overlayClassName={dialogThemedOverlayClass}
        onOverlayClick={handleClose}
      >
        <div className={dialogHeaderClass}>
          <AlertDialogTitle asChild>
            <div className={dialogTitleClass}>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800">
                <BellIcon className="size-5" />
              </span>
              <span className="truncate">{title}</span>
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

        <AlertDialogDescription className={cn(dialogDescriptionClass, 'mb-3 text-base text-neutral-800 dark:text-neutral-100')}>
          {description}
        </AlertDialogDescription>

        {imgSrc && (
          <div className="relative mb-2 flex h-[220px] w-full max-w-[400px] items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            {imgError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center border border-dashed border-neutral-300 text-sm text-neutral-400 dark:border-neutral-700">
                <ImageOffIcon className="mb-2 size-12" />
                <span>Image loading failed</span>
              </div>
            ) : imgHref ? (
              <a href={imgHref} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                <Image
                  src={imgSrc}
                  alt="image"
                  fill
                  className="rounded-lg object-contain"
                  priority={false}
                  placeholder="empty"
                  unoptimized
                  onError={() => setImgError(true)}
                  sizes="(max-width: 400px) 100vw, 400px"
                />
              </a>
            ) : (
              <Image
                src={imgSrc}
                alt="image"
                fill
                className="rounded-lg object-contain"
                priority={false}
                placeholder="empty"
                unoptimized
                onError={() => setImgError(true)}
                sizes="(max-width: 400px) 100vw, 400px"
              />
            )}
          </div>
        )}

        {(cancelText || confirmText) && (
          <div className={dialogFooterClass}>
            {cancelText && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onCancel?.();
                }}
                className={secondaryButtonClass}
              >
                {cancelText}
              </button>
            )}
            {confirmText && (
              <AlertDialogAction
                onClick={() => {
                  onOpenChange(false);
                  onConfirm?.();
                }}
                className={confirmText && !cancelText ? subtlePrimaryButtonClass : primaryButtonClass}
              >
                {confirmText}
              </AlertDialogAction>
            )}
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
} 
