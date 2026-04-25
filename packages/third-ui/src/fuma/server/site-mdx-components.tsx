import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import {
  createComposedSiteMdxComponents,
  DEFAULT_SITE_MDX_FEATURES,
  type SiteMdxFeature,
} from './site-mdx-presets';

export interface SiteMdxComponentsOptions {
  imageFallbackSrc?: string;
  cdnBaseUrl?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  additionalComponents?: MDXComponents;
  iconMap?: Record<string, ReactNode>;
  features?: SiteMdxFeature[];
}

export function createSiteMdxComponents(
  options: SiteMdxComponentsOptions,
) {
  const {
    additionalComponents,
    cdnBaseUrl,
    features = DEFAULT_SITE_MDX_FEATURES,
    iconMap = {},
    imageFallbackSrc,
    watermarkEnabled,
    watermarkText,
  } = options;

  return function getMDXComponents(components?: MDXComponents): MDXComponents {
    return createComposedSiteMdxComponents(
      features,
      {
        cdnBaseUrl,
        iconMap,
        imageFallbackSrc,
        watermarkEnabled,
        watermarkText,
      },
      additionalComponents,
      components,
    );
  };
}
