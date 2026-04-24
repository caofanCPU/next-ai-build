import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import type { SiteMdxFeature } from '@windrun-huaiin/contracts/mdx';
import {
  composeSiteMdxComponents,
  createSiteFeatureComponentMap,
  DEFAULT_SITE_MDX_FEATURES,
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
  const featureMap = createSiteFeatureComponentMap({
    cdnBaseUrl,
    iconMap,
    imageFallbackSrc,
    watermarkEnabled,
    watermarkText,
  });

  return function getMDXComponents(components?: MDXComponents): MDXComponents {
    return composeSiteMdxComponents(
      features,
      featureMap,
      additionalComponents,
      components,
    );
  };
}
