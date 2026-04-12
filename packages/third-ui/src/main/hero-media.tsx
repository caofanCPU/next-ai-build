'use client';

import { DelayedImg } from "./delayed-img";
import { cn } from '@windrun-huaiin/lib/utils';

interface HeroMediaProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  maxWidthClassName?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  preload?: boolean;
}

export function HeroMedia({
  src,
  alt,
  width,
  height,
  sizes = "(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 35vw",
  maxWidthClassName = "max-w-[500px]",
  wrapperClassName,
  imageClassName,
  placeholderClassName,
  preload = true,
}: HeroMediaProps) {
  return (
    <div className={cn("w-full", maxWidthClassName)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg shadow-purple-500/20",
          wrapperClassName,
        )}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <DelayedImg
          src={src}
          alt={alt}
          fill
          preload={preload}
          sizes={sizes}
          className={cn("rounded-lg object-cover group-hover:scale-105", imageClassName)}
          wrapperClassName="h-full w-full"
          placeholderClassName={cn("rounded-lg", placeholderClassName)}
        />
      </div>
    </div>
  );
}
