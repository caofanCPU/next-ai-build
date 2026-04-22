'use client';

import { CircleSmallIcon } from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';
import Link from 'next/link';
import type { HTMLAttributes, ReactNode } from 'react';

export type ZiaCardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;

  href?: string;
  external?: boolean;
};

export function ZiaCard({ icon, title, description, ...props }: ZiaCardProps) {
  const validHref = typeof props.href === 'string' && props.href.trim() !== '';
  const validDescription = typeof description === 'string' && description?.trim() !== '';

  if (validHref) {
    return (
      <Link
        href={props.href!}
        prefetch={false}
        data-card
        className={cn(
          'block rounded-lg border bg-fd-card p-4 text-fd-card-foreground shadow-md transition-colors @max-lg:col-span-full',
          'hover:bg-fd-accent/80',
          props.className,
        )}
        {...props}
      >
        <div className="not-prose mb-2 w-fit rounded-md border bg-fd-muted p-1.5 text-fd-muted-foreground [&_svg]:size-4">
          {icon ? icon : <CircleSmallIcon />}
        </div>
        <h3 className="not-prose mb-1 text-sm font-medium line-clamp-2 min-h-10">{title}</h3>
        {validDescription ? (
          <p className="my-0! text-sm text-fd-muted-foreground">{description}</p>
        ) : (
          <p className="my-0! text-sm text-fd-muted-foreground opacity-0 select-none">&nbsp;</p>
        )}
        {props.children ? (
          <div className="text-sm text-fd-muted-foreground prose-no-margin">
            {props.children}
          </div>
        ) : null}
      </Link>
    );
  }
  return (
    <div
      data-card
      className={cn(
        'block rounded-lg border bg-fd-card p-4 text-fd-card-foreground shadow-md transition-colors @max-lg:col-span-full',
        props.className,
      )}
      {...props}
    >
      <div className="not-prose mb-2 w-fit rounded-md border bg-fd-muted p-1.5 text-fd-muted-foreground [&_svg]:size-4">
        {icon ? icon : <CircleSmallIcon />}
      </div>
      <h3 className="not-prose mb-1 text-sm font-medium line-clamp-2 min-h-10">{title}</h3>
      {validDescription ? (
        <p className="my-0! text-sm text-fd-muted-foreground">{description}</p>
      ) : (
        <p className="my-0! text-sm text-fd-muted-foreground opacity-0 select-none">&nbsp;</p>
      )}
      {props.children ? (
        <div className="text-sm text-fd-muted-foreground prose-no-margin">
          {props.children}
        </div>
      ) : null}
    </div>
  );
}
