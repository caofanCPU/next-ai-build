'use client';

import React, { useState } from "react";
import Image from "next/image";
import { ImageOffIcon, InfoIcon, XIcon } from "@windrun-huaiin/base-ui/icons";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@windrun-huaiin/base-ui/ui";

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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 max-w-md w-full min-w-[320px] p-4 flex flex-col items-stretch"
      >
        {/* Header: left icon + title, right X close */}
        <div className="flex flex-row items-center justify-between mb-2">
          <AlertDialogTitle asChild>
            <div className="flex flex-row items-center gap-1 min-w-0 text-xl font-semibold">
              <InfoIcon className="w-5 h-5" />
              <span className="truncate">{title}</span>
            </div>
          </AlertDialogTitle>
          <button
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl ml-4"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            tabIndex={0}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* description area */}
        <AlertDialogDescription className="text-base font-medium text-neutral-800 dark:text-neutral-100 mb-2">
          {description}
        </AlertDialogDescription>
        {/* image area (optional) */}
        {imgSrc && (
          <div className="w-full max-w-[400px] h-[220px] relative flex items-center justify-center mb-2">
            {imgError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-400 text-sm">
                <ImageOffIcon className="w-12 h-12 mb-2" />
                <span>Image loading failed</span>
              </div>
            ) : imgHref ? (
              <a href={imgHref} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <Image
                  src={imgSrc}
                  alt="image"
                  fill
                  className="object-contain rounded-lg"
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
                className="object-contain rounded-lg"
                priority={false}
                placeholder="empty"
                unoptimized
                onError={() => setImgError(true)}
                sizes="(max-width: 400px) 100vw, 400px"
              />
            )}
          </div>
        )}
        {/* button area (optional) */}
        {(cancelText || confirmText) && (
          <div className="flex justify-end gap-2 mt-2">
            {cancelText && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  onCancel?.();
                }}
                className="px-6 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
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
                className="px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
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
