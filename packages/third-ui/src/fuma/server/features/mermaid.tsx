import type { MDXComponents } from 'mdx/types';
import { lazy } from 'react';

const Mermaid = lazy(() =>
  import('../../heavy/mermaid').then((mod) => ({ default: mod.Mermaid })),
);

export function createMermaidMdxComponents(
  watermarkEnabled?: boolean,
  watermarkText?: string,
): MDXComponents {
  return {
    Mermaid: (props) => (
      <Mermaid
        {...props}
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
      />
    ),
  };
}
