import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type MissingFeatureBlockProps = ComponentPropsWithoutRef<'div'> & {
  feature: string;
  component: string;
};

type MissingFeatureInlineProps = ComponentPropsWithoutRef<'span'> & {
  feature: string;
  component: string;
};

type MdxFallbackExtraProps = Record<string, unknown>;

function renderChildren(children: ReactNode) {
  if (children == null || children === '') {
    return <span className="italic text-fd-muted-foreground">No fallback content.</span>;
  }

  return children;
}

function hasChildren(children: ReactNode) {
  return children != null && children !== '';
}

function getDisplayProps(props: MdxFallbackExtraProps) {
  return Object.entries(props)
    .filter(([, value]) =>
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean',
    )
    .map(([key, value]) => [key, String(value)] as const);
}

export function MissingMdxFeatureBlock({
  feature,
  component,
  children,
  className,
  ...props
}: MissingFeatureBlockProps) {
  const displayProps = getDisplayProps(props);

  return (
    <div
      className={[
        'my-4 rounded-xl border border-red-300 bg-red-50/80 p-4 text-sm text-red-950 shadow-sm dark:border-red-800/80 dark:bg-red-950/30 dark:text-red-100',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 font-medium">
        <span>MDX feature not enabled</span>
        <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/60">{feature}</code>
        <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/60">{component}</code>
      </div>
      {displayProps.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
          {displayProps.map(([key, value]) => (
            <span
              key={key}
              className="rounded-md border border-red-200 bg-white/60 px-1.5 py-0.5 font-mono dark:border-red-900/70 dark:bg-black/20"
            >
              {key}={value}
            </span>
          ))}
        </div>
      )}
      <div className="whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-white/70 p-3 font-mono text-xs text-red-900 dark:border-red-900/70 dark:bg-black/20 dark:text-red-100">
        {renderChildren(children)}
      </div>
    </div>
  );
}

export function MissingMdxFeatureInline({
  feature,
  component,
  children,
  className,
  ...props
}: MissingFeatureInlineProps) {
  const displayProps = getDisplayProps(props);

  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1 rounded-md border border-red-300 bg-red-50 px-1.5 py-0.5 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100',
        className,
      ].filter(Boolean).join(' ')}
      title={`MDX feature not enabled: ${feature} (${component})`}
    >
      <span className="font-medium">{component}</span>
      {displayProps.map(([key, value]) => (
        <span key={key} className="font-mono text-xs opacity-80">
          {key}={value}
        </span>
      ))}
      {hasChildren(children) && (
        <span className="font-mono text-xs opacity-80">{children}</span>
      )}
    </span>
  );
}

export function createMissingMdxFeatureComponents() {
  return {
    MathBlock: (props: ComponentPropsWithoutRef<'div'>) => (
      <MissingMdxFeatureBlock {...props} feature="math" component="MathBlock" />
    ),
    InlineMath: (props: ComponentPropsWithoutRef<'span'>) => (
      <MissingMdxFeatureInline {...props} feature="math" component="InlineMath" />
    ),
    Mermaid: (props: ComponentPropsWithoutRef<'div'>) => (
      <MissingMdxFeatureBlock {...props} feature="diagram renderer" component="Mermaid" />
    ),
    TypeTable: (props: ComponentPropsWithoutRef<'div'>) => (
      <MissingMdxFeatureBlock {...props} feature="API table renderer" component="TypeTable" />
    ),
  };
}
