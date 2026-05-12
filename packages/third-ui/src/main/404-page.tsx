'use client';

import { NotFoundIcon } from '@windrun-huaiin/base-ui/components/shared';
import { themeBgColor, themeButtonGradientClass, themeIconColor, themeViaColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import { useEffect, useState, type ReactNode } from 'react';

interface NotFoundPageProps {
  siteIcon: ReactNode;
}

export function NotFoundPage({ siteIcon }: NotFoundPageProps) {
  const [glitchText, setGlitchText] = useState('404');
  const homeUrl = process.env.NEXT_PUBLIC_BASE_URL || '/';

  useEffect(() => {
    const glitchChars = ['4', '0', '4', '?', '#', '!', '*', '&', '%', '$'];

    const interval = setInterval(() => {
      if (Math.random() < 0.5) {
        setGlitchText('404');
      } else {
        const randomChars = Array.from(
          { length: 3 },
          () => glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join('');
        setGlitchText(randomChars);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="relative flex justify-center">
          <h1
            className={cn(
              'text-8xl md:text-9xl font-bold bg-linear-to-r bg-clip-text text-transparent select-none',
              themeButtonGradientClass
            )}
            style={{
              fontFamily: 'Montserrat, monospace',
              textShadow: '0 0 30px rgba(172, 98, 253, 0.3)',
              letterSpacing: '0.1em',
            }}
          >
            {glitchText}
          </h1>
          <div className="absolute inset-0 pointer-events-none">
            <div className={cn('h-full w-full bg-linear-to-b from-transparent to-transparent animate-pulse', themeViaColor)} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page you&#39;re looking for doesn&#39;t exist
          </p>
          <a
            href={homeUrl}
            className={cn(
              'inline-flex text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-80',
              themeIconColor,
              'decoration-current'
            )}
          >
            Back to Homepage
          </a>
        </div>

        <div className="flex justify-center items-center gap-8 pt-8 opacity-60">
          <a
            href={homeUrl}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-opacity hover:opacity-80"
          >
            {siteIcon}
            <span>Woops!</span>
          </a>
          <div className={cn('w-2 h-2 rounded-full animate-ping', themeBgColor)} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <NotFoundIcon />
            <span>Error Code: 404</span>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
                linear-gradient(rgba(172, 98, 253, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(172, 98, 253, 0.1) 1px, transparent 1px)
              `,
            backgroundSize: '50px 50px',
          }}
        />

        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn('absolute w-2 h-2 rounded-full animate-bounce', themeBgColor)}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
