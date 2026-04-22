import katex from 'katex';
import { cn } from '@windrun-huaiin/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

type MathSourceProps = {
  children?: ReactNode;
  math?: string;
  formula?: string;
};

type Align = 'left' | 'center' | 'right';

export type MathBlockProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
  MathSourceProps & {
    title?: ReactNode;
    titleAlign?: Align;
  };

export type InlineMathProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> &
  MathSourceProps & {
    align?: Align;
  };

const alignClassMap: Record<Align, string> = {
  left: 'text-left justify-start',
  center: 'text-center justify-center',
  right: 'text-right justify-end',
};

const textAlignClassMap: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getMathSource({ children, math, formula }: MathSourceProps): string {
  if (typeof math === 'string' && math.trim() !== '') return math.trim();
  if (typeof formula === 'string' && formula.trim() !== '') return formula.trim();
  if (typeof children === 'string' && children.trim() !== '') return children.trim();

  if (Array.isArray(children)) {
    const text = children
      .map((item) => (typeof item === 'string' ? item : ''))
      .join('')
      .trim();

    if (text !== '') return text;
  }

  return '';
}

function renderMath(source: string, displayMode: boolean) {
  if (source === '') return '';

  return katex.renderToString(source, {
    displayMode,
    throwOnError: false,
    output: 'html',
    strict: 'ignore',
    trust: false,
  });
}

export function MathBlock({
  title,
  titleAlign = 'center',
  children,
  math,
  formula,
  className,
  ...props
}: MathBlockProps) {
  const source = getMathSource({ children, math, formula });
  const html = renderMath(source, true);

  return (
    <div
      {...props}
      className={cn(
        'not-prose my-6 overflow-x-auto rounded-xl border bg-fd-card p-4 text-fd-card-foreground',
        className,
      )}
    >
      {title ? (
        <div
          className={cn(
            'mb-3 text-sm font-medium text-fd-muted-foreground',
            alignClassMap[titleAlign].split(' ')[0],
          )}
        >
          {title}
        </div>
      ) : null}
      {html ? (
        <div
          className="min-w-fit [&_.katex-display]:my-0 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="text-sm text-fd-muted-foreground">Empty math block.</div>
      )}
    </div>
  );
}

export function InlineMath({
  children,
  math,
  formula,
  align = 'center',
  className,
  ...props
}: InlineMathProps) {
  const source = getMathSource({ children, math, formula });
  const html = renderMath(source, false);

  return (
    <span
      {...props}
      className={cn(
        'mx-1 inline-flex max-w-full align-middle rounded-md bg-neutral-200 px-2 py-0.5 text-sm leading-none dark:bg-white/20 [&_.katex]:text-inherit',
        textAlignClassMap[align],
        className,
      )}
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  );
}
