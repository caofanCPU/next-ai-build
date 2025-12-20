'use client';

import { Button } from "@windrun-huaiin/base-ui/ui";
import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from "@windrun-huaiin/base-ui/components/server";
import Link from "next/link";
import React, { useState } from 'react';

export interface GradientButtonProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  // for Link
  href?: string;
  openInNewTab?: boolean;
  
  // for click
  onClick?: () => void | Promise<void>;
  loadingText?: React.ReactNode;
  preventDoubleClick?: boolean;
}

export function GradientButton({
  title,
  icon,
  align = 'left',
  disabled = false,
  className = "",
  href,
  openInNewTab = true,
  onClick,
  loadingText,
  preventDoubleClick = true,
  iconClassName,
}: GradientButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const actualLoadingText = loadingText || title?.toString().trim() || 'Loading...'

  const defaultIconClass = "h-4 w-4";
  const finalIconClass = cn("text-white", iconClassName || defaultIconClass);

  // set justify class according to alignment
  const getAlignmentClass = () => {
    switch (align) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default: // 'left'
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

  // icon
  const iconProvided = icon !== undefined;

  const iconNode = (() => {
    if (isLoading) {
      return <icons.Loader2 className={cn(finalIconClass, 'animate-spin')} />;
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

    return <icons.ArrowRight className={cn(finalIconClass)} />;
  })();

  const shouldRenderIcon = iconNode !== null && iconNode !== undefined;

  const buttonContent = onClick ? (
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

  const buttonClassName = cn(
    'bg-linear-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-700 text-white text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-full',
    alignmentClass,
    isDisabled && 'opacity-50 cursor-not-allowed',
    className,
  );

  return (
    <div className={`flex flex-row gap-3 ${getAlignmentClass()}`}>
      {onClick ? (
        // for click
        <Button
          size="lg"
          className={buttonClassName}
          onClick={handleClick}
          disabled={isDisabled}
        >
          {buttonContent}
        </Button>
      ) : (
        // for Link
        <Button
          asChild
          size="lg"
          className={buttonClassName}
          disabled={isDisabled}
        >
          <Link
            href={href || "#"}
            className="no-underline hover:no-underline"
            {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={isDisabled ? (e) => e.preventDefault() : undefined}
          >
            {buttonContent}
          </Link>
        </Button>
      )}
    </div>
  );
} 
