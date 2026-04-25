import type { MDXComponents } from 'mdx/types';
import { lazy } from 'react';

const MathBlock = lazy(() =>
  import('../../heavy/math').then((mod) => ({ default: mod.MathBlock })),
);
const InlineMath = lazy(() =>
  import('../../heavy/math').then((mod) => ({ default: mod.InlineMath })),
);

export function createMathMdxComponents(): MDXComponents {
  return {
    MathBlock,
    InlineMath,
  };
}
