'use client';

import type { ReactNode } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';

interface HeroSectionProps {
  content: ReactNode;
  media: ReactNode;
  className?: string;
  contentClassName?: string;
  mediaClassName?: string;
}

export function HeroSection({
  content,
  media,
  className,
  contentClassName,
  mediaClassName,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "mx-auto mt-12 flex max-w-6xl flex-col gap-10 px-6 py-8 md:min-w-[calc(100vw-22rem)] md:px-4 md:flex-row md:items-center md:gap-12",
        className,
      )}
    >
      <div className={cn("flex-1 space-y-6", contentClassName)}>
        {content}
      </div>
      <div className={cn("relative flex flex-1 justify-center md:justify-end", mediaClassName)}>
        {media}
      </div>
    </section>
  );
}
