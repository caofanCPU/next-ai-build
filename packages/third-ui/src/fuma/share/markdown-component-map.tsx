import { cn } from '@windrun-huaiin/lib/utils';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { type ComponentType } from 'react';
import { ImageZoom } from '../heavy';

export type MarkdownComponentMap = Record<string, ComponentType<any>>;

function normalizeMarkdownProps<T extends Record<string, any>>(props: T) {
  const { class: legacyClassName, className, ...restProps } = props;

  return {
    ...restProps,
    className: cn(
      typeof legacyClassName === 'string' ? legacyClassName : undefined,
      className,
    ),
  };
}

export const baseMarkdownComponents: MarkdownComponentMap = {
  ...defaultMdxComponents,
  a: ({ className, ...props }) => (
    <a
      {...normalizeMarkdownProps(props)}
      className={cn(
        'underline underline-offset-4 transition hover:opacity-80',
        normalizeMarkdownProps(props).className,
        className,
      )}
      target={props.target ?? '_blank'}
      rel={props.rel ?? 'noreferrer noopener'}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      {...normalizeMarkdownProps(props)}
      className={cn(
        'border-l-2 border-border pl-4 text-muted-foreground',
        normalizeMarkdownProps(props).className,
        className,
      )}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      {...normalizeMarkdownProps(props)}
      className={cn(
        'rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]',
        normalizeMarkdownProps(props).className,
        className,
      )}
    />
  ),
  h1: ({ className, ...props }) => (
    <h1
      {...normalizeMarkdownProps(props)}
      className={cn('text-2xl font-semibold tracking-tight', normalizeMarkdownProps(props).className, className)}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      {...normalizeMarkdownProps(props)}
      className={cn('text-xl font-semibold tracking-tight', normalizeMarkdownProps(props).className, className)}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      {...normalizeMarkdownProps(props)}
      className={cn('text-lg font-semibold', normalizeMarkdownProps(props).className, className)}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      {...normalizeMarkdownProps(props)}
      className={cn('text-base font-semibold', normalizeMarkdownProps(props).className, className)}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      {...normalizeMarkdownProps(props)}
      className={cn('text-sm font-semibold', normalizeMarkdownProps(props).className, className)}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      {...normalizeMarkdownProps(props)}
      className={cn('text-sm font-semibold', normalizeMarkdownProps(props).className, className)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr
      {...normalizeMarkdownProps(props)}
      className={cn('border-border', normalizeMarkdownProps(props).className, className)}
    />
  ),
  img: ({ className, alt, src, ...props }) => (
    <ImageZoom
      {...normalizeMarkdownProps(props)}
      alt={typeof alt === 'string' ? alt : ''}
      src={typeof src === 'string' ? src : ''}
      className={cn(
        'overflow-hidden rounded-2xl',
        normalizeMarkdownProps(props).className,
        className,
      )}
    />
  ),
  li: ({ className, ...props }) => (
    <li
      {...normalizeMarkdownProps(props)}
      className={cn('leading-7', normalizeMarkdownProps(props).className, className)}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      {...normalizeMarkdownProps(props)}
      className={cn('list-decimal space-y-2 pl-6', normalizeMarkdownProps(props).className, className)}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      {...normalizeMarkdownProps(props)}
      className={cn('leading-7', normalizeMarkdownProps(props).className, className)}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      {...normalizeMarkdownProps(props)}
      className={cn(
        'overflow-x-auto rounded-2xl border border-border bg-muted px-4 py-3 text-sm',
        normalizeMarkdownProps(props).className,
        className,
      )}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="overflow-x-auto">
      <table
        {...normalizeMarkdownProps(props)}
        className={cn(
          'w-full border-collapse text-sm',
          normalizeMarkdownProps(props).className,
          className,
        )}
      />
    </div>
  ),
  td: ({ className, ...props }) => (
    <td
      {...normalizeMarkdownProps(props)}
      className={cn(
        'border border-border px-3 py-2 align-top',
        normalizeMarkdownProps(props).className,
        className,
      )}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      {...normalizeMarkdownProps(props)}
      className={cn(
        'border border-border px-3 py-2 text-left font-medium',
        normalizeMarkdownProps(props).className,
        className,
      )}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      {...normalizeMarkdownProps(props)}
      className={cn('list-disc space-y-2 pl-6', normalizeMarkdownProps(props).className, className)}
    />
  ),
};
