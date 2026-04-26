'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { ArrowRightIcon, Loader2Icon } from "@windrun-huaiin/base-ui/icons";
import {
  themeBgColor,
  themeBorderColor,
  themeButtonGradientClass,
  themeButtonGradientHoverClass,
  themeIconColor,
  themeMainBgColor,
} from "@windrun-huaiin/base-ui/lib";
import Link from "next/link";
import React, { useState } from 'react';

type GradientButtonVariant = 'default' | 'soft' | 'subtle';

export interface GradientButtonProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  iconForcePosition?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  href?: string;
  openInNewTab?: boolean;
  preserveReferrer?: boolean;
  onClick?: () => void | Promise<void>;
  loadingText?: React.ReactNode;
  preventDoubleClick?: boolean;
  variant?: GradientButtonVariant;
}

export function GradientButton({
  title,
  icon,
  iconForcePosition,
  align = 'left',
  disabled = false,
  className = "",
  href,
  openInNewTab = true,
  preserveReferrer = false,
  onClick,
  loadingText,
  preventDoubleClick = true,
  iconClassName,
  variant = 'default',
}: GradientButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const actualLoadingText = loadingText || title?.toString().trim() || 'Loading...';

  const defaultIconClass = "h-4 w-4";
  const finalIconClass = cn(
    variant === 'default' ? 'text-white' : themeIconColor,
    iconClassName || defaultIconClass
  );

  const getAlignmentClass = () => {
    switch (align) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      e.preventDefault();

      if (preventDoubleClick) {
        setIsLoading(true);
      }

      try {
        await onClick();
      } catch (error) {
        console.error('GradientButton onClick error:', error);
      } finally {
        if (preventDoubleClick) {
          setIsLoading(false);
        }
      }
    }
  };

  const isDisabled = disabled || isLoading;
  const displayTitle = isLoading ? actualLoadingText : title;
  const iconProvided = icon !== undefined;

  const iconNode = (() => {
    if (isLoading) {
      return <Loader2Icon className={cn(finalIconClass, 'animate-spin')} />;
    }

    if (iconProvided) {
      if (icon === null || icon === false) {
        return null;
      }

      if (React.isValidElement<{ className?: string }>(icon)) {
        return React.cloneElement(icon, {
          className: cn(finalIconClass, icon.props.className),
        });
      }

      return icon;
    }

    return <ArrowRightIcon className={cn(finalIconClass)} />;
  })();

  const shouldRenderIcon = iconNode !== null && iconNode !== undefined;
  const iconPosition = iconForcePosition ?? (onClick ? 'left' : 'right');

  const buttonContent = iconPosition === 'left' ? (
    <>
      {shouldRenderIcon ? <span>{iconNode}</span> : null}
      <span className={cn(shouldRenderIcon && 'ml-1')}>{displayTitle}</span>
    </>
  ) : (
    <>
      <span>{displayTitle}</span>
      {shouldRenderIcon ? <span className="ml-1">{iconNode}</span> : null}
    </>
  );

  const alignmentClass = align === 'right'
    ? 'justify-end'
    : align === 'center'
      ? 'justify-center'
      : 'justify-start';

  const baseButtonStyles = "inline-flex items-center gap-2 whitespace-nowrap h-11 px-8 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variantClassName = variant === 'soft'
    ? cn(
        themeBgColor,
        themeIconColor,
        themeBorderColor,
        'border shadow-sm hover:shadow-md hover:brightness-95'
      )
    : variant === 'subtle'
      ? cn(
          themeMainBgColor,
          themeIconColor,
          'border border-neutral-200 shadow-sm hover:shadow-md hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800'
        )
      : cn(
          themeButtonGradientClass,
          themeButtonGradientHoverClass,
          'text-white shadow-lg hover:shadow-xl'
        );

  const buttonClassName = cn(
    baseButtonStyles,
    variantClassName,
    'text-base font-bold transition-all duration-300 rounded-full',
    alignmentClass,
    isDisabled && 'opacity-50 cursor-not-allowed',
    className,
  );

  return (
    <div className={`flex flex-row gap-3 ${getAlignmentClass()}`}>
      {onClick ? (
        <button
          type="button"
          className={buttonClassName}
          onClick={handleClick}
          disabled={isDisabled}
        >
          {buttonContent}
        </button>
      ) : (
        <Link
          href={href || "#"}
          className={cn(buttonClassName, "no-underline hover:no-underline")}
          {...(openInNewTab ? { target: "_blank", rel: preserveReferrer ? 'noopener' : 'noopener noreferrer' } : {})}
          onClick={isDisabled ? (e) => e.preventDefault() : undefined}
          aria-disabled={isDisabled}
        >
          {buttonContent}
        </Link>
      )}
    </div>
  );
}
