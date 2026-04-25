import type { MDXComponents } from 'mdx/types';
import { lazy } from 'react';

const TypeTable = lazy(() =>
  import('fumadocs-ui/components/type-table').then((mod) => ({ default: mod.TypeTable })),
);

export function createTypeTableMdxComponents(): MDXComponents {
  return {
    TypeTable,
  };
}
