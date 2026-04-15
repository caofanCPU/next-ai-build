import { themeIconColor, themeSvgIconSize } from '@base-ui/lib/theme-util';
import { cn } from '@windrun-huaiin/lib/utils';
import { type LucideProps } from 'lucide-react';
import React from 'react';

export type StyledLucideIconComponent = (props: LucideProps) => React.ReactElement;

function hasTextColorClass(className: string): boolean {
  return /\btext-\w+(-\d+)?\b/.test(className);
}

function hasSizeClass(className: string): boolean {
  return /\b(size-\d+|w-\d+|h-\d+)\b/.test(className);
}

function buildStyledProps(props: LucideProps): LucideProps {
  const originalClassName = props.className || '';
  const nextClassName = hasTextColorClass(originalClassName)
    ? originalClassName
    : `${themeIconColor} ${originalClassName}`.trim();

  if (hasSizeClass(originalClassName)) {
    return { ...props, className: nextClassName, size: undefined };
  }

  return {
    ...props,
    className: nextClassName,
    style: {
      width: props.size || themeSvgIconSize,
      height: props.size || themeSvgIconSize,
      ...props.style,
    },
  };
}

export function createGlobalIcon(
  IconComponent: React.ComponentType<LucideProps>,
  displayName?: string
): StyledLucideIconComponent {
  const StyledIcon = (props: LucideProps): React.ReactElement => {
    return <IconComponent {...buildStyledProps(props)} />;
  };

  StyledIcon.displayName = displayName ? `Styled(${displayName})` : `Styled(${IconComponent.displayName || IconComponent.name || 'Icon'})`;
  return StyledIcon;
}

export function createGlobalLucideIcon(
  IconComponent: React.ComponentType<LucideProps>,
  displayName?: string
): StyledLucideIconComponent {
  return createGlobalIcon(IconComponent, displayName);
}

type GlobalAccentIconProps = {
  icon: React.ComponentType<LucideProps>;
  className?: string;
  iconClassName?: string;
  foregroundClassName?: string;
  sizeClassName?: string;
  iconSize?: LucideProps['size'];
};

export function GlobalAccentIcon({
  icon: Icon,
  className,
  iconClassName,
  foregroundClassName = 'text-neutral-100 dark:text-neutral-900',
  sizeClassName = 'size-9',
  iconSize,
}: GlobalAccentIconProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-current shadow-sm transition',
        themeIconColor,
        sizeClassName,
        className
      )}
    >
      <Icon
        size={iconSize}
        className={cn(
          'size-4',
          foregroundClassName,
          iconClassName
        )}
      />
    </span>
  );
}
