import type { MDXComponents } from 'mdx/types';
import { baseMarkdownComponents } from '../../share/markdown-component-map';
import { lazy } from 'react';
import { createMissingMdxFeatureComponents } from '../site-mdx-fallbacks';

const ImageZoom = lazy(() =>
  import('../../heavy/image-zoom').then((mod) => ({ default: mod.ImageZoom })),
);

export function createBaseMdxComponents(
  imageFallbackSrc?: string,
): MDXComponents {
  return {
    ...baseMarkdownComponents,
    ...createMissingMdxFeatureComponents(),
    img: (props) => (
      <ImageZoom
        {...(props as any)}
        fallbackSrc={imageFallbackSrc}
      />
    ),
  };
}
