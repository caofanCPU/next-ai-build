"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FAQSIcon, XIcon } from "@windrun-huaiin/base-ui/icons";
import { cn } from "@windrun-huaiin/lib/utils";
import {
  closeButtonClass,
  dialogDescriptionClass,
  dialogFooterClass,
  dialogHeaderClass,
  highPrioritySurfaceClass,
  highPriorityTitleClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./dialog-styles";
import { themeBgColor, themeBorderColor, themeIconColor } from "@windrun-huaiin/base-ui/lib";
import { DialogLoadingAction, DialogActionHandler, useDialogLoadingAction } from "./dialog-loading-action";

interface HighPriorityConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: DialogActionHandler;
  onConfirm: DialogActionHandler;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loadingActions?: readonly DialogLoadingAction[];
}

export function HighPriorityConfirmDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loadingActions,
}: HighPriorityConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const { dialogLoading, runDialogAction } = useDialogLoadingAction({ loadingActions, onOpenChange });
  
  useEffect(() => {
    // Ensure portal target exists and prevent hydration mismatch
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) return dialogLoading;

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      {open && createPortal(
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={cn(highPrioritySurfaceClass, "scale-100")}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={dialogHeaderClass}>
              <h3 className={highPriorityTitleClass}>
                <span className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-1', themeBgColor, themeBorderColor)}>
                  <FAQSIcon className={cn('size-5', themeIconColor)} />
                </span>
                <span className="min-w-0 truncate">{title}</span>
              </h3>
              <button
                type="button"
                className={closeButtonClass}
                onClick={handleClose}
                aria-label="Close"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className={dialogDescriptionClass}>
              {description}
            </div>
            <div className={dialogFooterClass}>
              <button
                type="button"
                onClick={() => {
                  void runDialogAction('cancel', onCancel);
                }}
                className={secondaryButtonClass}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  void runDialogAction('confirm', onConfirm);
                }}
                className={cn(primaryButtonClass, "hover:scale-105 active:scale-95")}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {dialogLoading}
    </>
  );
}
