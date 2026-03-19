/* 
* For the icon used in the project, unified management is required
* 1. Strictly control the number of icons introduced to reduce the project package size and use them as needed
* 2. Unify the style customization, and keep the icon style consistent within the project
* 3. Mainly support the introduction of icons in mdx files, and report errors in advance
*/

import { BUILTIN_ICON_COMPONENTS } from '@base-ui/assets';
import { themeIconColor, themeSvgIconSize, themeBorderColor, themeRingColor } from '@base-ui/lib/theme-util';
import { cn } from '@windrun-huaiin/lib/utils';
import * as limitedIconsModule from '@base-ui/components/limited-lucide-icons';
import { type LucideProps } from 'lucide-react';
import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

// Type for styled Lucide icon components (accepts LucideProps)
type StyledLucideIconComponent = (props: LucideProps) => React.ReactElement;

// Union type for all icon components (both Lucide and built-in)
type IconComponent = StyledLucideIconComponent | React.ComponentType<LucideProps>;

// Style Lucide icons with global color
const tempStyledLimitedIcons: Partial<Record<keyof typeof limitedIconsModule, StyledLucideIconComponent>> = {};

for (const iconNameKey in limitedIconsModule) {
  if (Object.prototype.hasOwnProperty.call(limitedIconsModule, iconNameKey)) {
    const iconName = iconNameKey as keyof typeof limitedIconsModule;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const OriginalIconComponent = limitedIconsModule[iconName] as any; 

    if (typeof OriginalIconComponent === 'function' || 
        (typeof OriginalIconComponent === 'object' && 
         OriginalIconComponent !== null && 
         OriginalIconComponent.$$typeof === Symbol.for('react.forward_ref'))) {
      const ComponentToRender = OriginalIconComponent as React.ComponentType<LucideProps>;
      
      const StyledIcon = (props: LucideProps): React.ReactElement => {
        const originalClassName = props.className || '';
        // Check if user provided a text color class, if so, don't use global color
        const hasTextColor = /\btext-\w+(-\d+)?\b/.test(originalClassName);
        // Check if user provided size/dimension classes
        const hasSizeClass = /\b(size-\d+|w-\d+|h-\d+)\b/.test(originalClassName);
        
        const newClassName = hasTextColor 
          ? originalClassName 
          : `${themeIconColor} ${originalClassName}`.trim();
        
        // If user provided size classes in className, don't use default size
        // Otherwise, use inline styles to ensure size precedence over external CSS
        const finalProps = hasSizeClass 
          ? { ...props, className: newClassName, size: undefined }
          : { 
              ...props, 
              className: newClassName,
              style: { 
                width: props.size || themeSvgIconSize, 
                height: props.size || themeSvgIconSize,
                ...props.style 
              }
            };
          
        return <ComponentToRender {...finalProps} />;
      };
      StyledIcon.displayName = `Styled(${iconName})`;
      tempStyledLimitedIcons[iconName] = StyledIcon;
    } else {
      console.warn(`[global-icon.tsx] Skipped styling for "${iconName}" as it is not a function, undefined, or not a recognized React component type. Value:`, OriginalIconComponent);
    }
  }
}

const styledLimitedIconsPart = tempStyledLimitedIcons as {
  [K in keyof typeof limitedIconsModule]: StyledLucideIconComponent;
};

// Wrap built-in SVG components with the same className handling logic
const tempWrappedBuiltinIcons: Partial<Record<keyof typeof BUILTIN_ICON_COMPONENTS, StyledLucideIconComponent>> = {};
for (const [iconName, IconComponent] of Object.entries(BUILTIN_ICON_COMPONENTS)) {
  const WrappedIcon = (props: LucideProps): React.ReactElement => {
    const originalClassName = props.className || '';
    // Check if user provided a text color class, if so, don't use global color
    const hasTextColor = /\btext-\w+(-\d+)?\b/.test(originalClassName);
    // Check if user provided size/dimension classes
    const hasSizeClass = /\b(size-\d+|w-\d+|h-\d+)\b/.test(originalClassName);
    
    const newClassName = hasTextColor 
      ? originalClassName 
      : `${themeIconColor} ${originalClassName}`.trim();
    
    // If user provided size classes in className, don't use default size
    // Otherwise, use inline styles to ensure size precedence over external CSS
    const finalProps = hasSizeClass 
      ? { ...props, className: newClassName, size: undefined }
      : { 
          ...props, 
          className: newClassName,
          style: { 
            width: props.size || themeSvgIconSize, 
            height: props.size || themeSvgIconSize,
            ...props.style 
          }
        };
      
    return <IconComponent {...finalProps} />;
  };
  WrappedIcon.displayName = `Wrapped(${iconName})`;
  tempWrappedBuiltinIcons[iconName as keyof typeof BUILTIN_ICON_COMPONENTS] = WrappedIcon;
}

const wrappedBuiltinIconsPart = tempWrappedBuiltinIcons as {
  [K in keyof typeof BUILTIN_ICON_COMPONENTS]: StyledLucideIconComponent;
};

// All icons should be imported from here, and icons will occupy the project package size, so it is best to design and plan in advance
export const globalLucideIcons = {
  ...styledLimitedIconsPart,
  ...wrappedBuiltinIconsPart, // Spread all wrapped built-in icon components
};

// Default fallback icon - centralized configuration
// Use a safe fallback that we know exists in both Lucide and custom icons
const DEFAULT_FALLBACK_ICON = 'Sparkles' as keyof typeof globalLucideIcons;

/**
 * use iconKey to load icon safely
 * @param iconKey translation or configuration
 * @param createElement whether to return a React element instead of component
 */
export function getGlobalIcon(
  iconKey: string | undefined
): IconComponent;
export function getGlobalIcon(
  iconKey: string | undefined,
  createElement: true
): React.ReactElement | undefined;
export function getGlobalIcon(
  iconKey: string | undefined,
  createElement?: boolean
): IconComponent | React.ReactElement | undefined {
  // Handle undefined iconKey case (for getIconElement compatibility)
  if (!iconKey) {
    if (createElement) {
      return undefined;
    }
    return globalLucideIcons[DEFAULT_FALLBACK_ICON] as IconComponent;
  }
  
  const Icon = globalLucideIcons[iconKey as keyof typeof globalLucideIcons];
  if (!Icon) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // only show in dev|test
      // eslint-disable-next-line no-console
      console.warn(
        `[global-icon] iconKey "${iconKey}" is not defined in globalIcons, will use default "${String(DEFAULT_FALLBACK_ICON)}" icon, please check!`
      );
    }
    const FallbackIcon = globalLucideIcons[DEFAULT_FALLBACK_ICON];
    if (createElement) {
      return React.createElement(FallbackIcon as React.ComponentType<any>);
    }
    return FallbackIcon as IconComponent;
  }
  
  if (createElement) {
    return React.createElement(Icon as React.ComponentType<any>);
  }
  return Icon as IconComponent;
}

/**
 * Get icon element (for fumadocs source compatibility)
 * This is a wrapper around getGlobalIcon for backwards compatibility
 * @param icon icon key from frontmatter
 */
export function getIconElement(
  icon: string | undefined, 
): React.ReactElement | undefined {
  // Note: defaultIconKey parameter is kept for backwards compatibility but ignored
  // The function now uses the centralized DEFAULT_FALLBACK_ICON
  return getGlobalIcon(icon, true);
}

// Define the default site icon as a functional component (for export)
export const DefaultSiteIcon = () => (
  <globalLucideIcons.Zap className={cn("h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border", themeBorderColor, themeRingColor, themeIconColor)} />
);

// Note: SiteIcon is available from @base-ui/lib/site-icon as a separate client component

// Define 404 not found icon as a functional component (fixed, no configuration)
export const NotFoundIcon = () => (
  <globalLucideIcons.SquareTerminal className={cn("h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border", themeBorderColor, themeRingColor, themeIconColor)} />
); 