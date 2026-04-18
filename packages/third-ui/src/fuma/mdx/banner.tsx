'use client';

import { cva } from 'class-variance-authority';
import { type HTMLAttributes, useEffect, useState } from 'react';
import { XIcon } from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      color: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'border hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        secondary:
          'border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'gap-1 px-2 py-1.5 text-xs',
        icon: 'p-1.5 [&_svg]:size-5',
        'icon-sm': 'p-1.5 [&_svg]:size-4.5',
      },
    },
  },
);

const maskImage =
  'linear-gradient(to bottom,white,transparent), radial-gradient(circle at top center, white, transparent)';

const rainbowLayer = (
  <>
    <div
      className="absolute inset-0 z-[-1]"
      style={
        {
          maskImage,
          maskComposite: 'intersect',
          animation: 'fd-moving-banner 16s linear infinite',
          '--start': 'rgba(0,87,255,0.5)',
          '--mid': 'rgba(255,0,166,0.77)',
          '--end': 'rgba(255,77,0,0.4)',
          '--via': 'rgba(164,255,68,0.4)',
          animationDirection: 'reverse',
          backgroundImage:
            'repeating-linear-gradient(60deg, var(--end), var(--start) 2%, var(--start) 5%, transparent 8%, transparent 14%, var(--via) 18%, var(--via) 22%, var(--mid) 28%, var(--mid) 30%, var(--via) 34%, var(--via) 36%, transparent, var(--end) calc(50% - 12px))',
          backgroundSize: '200% 100%',
          mixBlendMode: 'difference',
        } as object
      }
    />
    <div
      className="absolute inset-0 z-[-1]"
      style={
        {
          maskImage,
          maskComposite: 'intersect',
          animation: 'fd-moving-banner 20s linear infinite',
          '--start': 'rgba(255,120,120,0.5)',
          '--mid': 'rgba(36,188,255,0.4)',
          '--end': 'rgba(64,0,255,0.51)',
          '--via': 'rgba(255,89,0,0.56)',
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--end), var(--start) 4%, var(--start) 8%, transparent 9%, transparent 14%, var(--mid) 16%, var(--mid) 20%, transparent, var(--via) 36%, var(--via) 40%, transparent 42%, var(--end) 46%, var(--end) calc(50% - 16.8px))',
          backgroundSize: '200% 100%',
          mixBlendMode: 'color-dodge',
        } as object
      }
    />
    <style>
      {`@keyframes fd-moving-banner {
            from { background-position: 0% 0;  }
            to { background-position: 100% 0;  }
         }`}
    </style>
  </>
);

export function Banner({
  id,
  variant = 'rainbow',
  changeLayout = true,
  height = 3,
  floating = true,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /**
   * @defaultValue default is 3 rem
   */
  height?: number;

  /**
   * @defaultValue 'normal'
   */
  variant?: 'rainbow' | 'normal';

  /**
   * Change Fumadocs layout styles
   *
   * @defaultValue true
   */
  changeLayout?: boolean;
  /**
   * Render the banner as a floating fixed element.
   *
   * @defaultValue true
   */
  floating?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const globalKey = id ? `nd-banner-${id}` : null;
  const bannerHeight = `${height}rem`;

  useEffect(() => {
    if (globalKey) setOpen(localStorage.getItem(globalKey) !== 'true');
  }, [globalKey]);

  if (!open) return null;

  return (
    <div
      id={id}
      {...props}
      className={cn(
        'flex flex-row items-center justify-center px-4 text-center text-sm font-medium',
        'bg-neutral-100 dark:bg-neutral-900',
        !open && 'hidden',
        className,
      )}
      style={{
        height: bannerHeight,
        minHeight: bannerHeight,
        maxHeight: bannerHeight,
        margin: 0,
        borderRadius: 0,
        overflow: 'hidden',
        ...(floating
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              zIndex: 1001,
            }
          : {
              position: 'relative',
              width: '100%',
              zIndex: 0,
            }),
        ...style,
      }}
    >
      
      {globalKey ? (
        <style>{`.${globalKey} #${id} { display: none; }`}</style>
      ) : null}
      {globalKey ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `if (localStorage.getItem('${globalKey}') === 'true') document.documentElement.classList.add('${globalKey}');`,
          }}
        />
      ) : null}

      {variant === 'rainbow' ? rainbowLayer : null}
      {props.children}
      {id ? (
        <button
          type="button"
          aria-label="Close Banner"
          onClick={() => {
            setOpen(false);
            if (globalKey) localStorage.setItem(globalKey, 'true');
          }}
          className={cn(
            buttonVariants({
              color: 'ghost',
              className:
                'absolute inset-e-2 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-400',
              size: 'icon',
            }),
          )}
        >
          <XIcon />
        </button>
      ) : null}
    </div>
  );
}
