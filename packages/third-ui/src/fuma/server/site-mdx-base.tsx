import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import type { MDXComponents } from 'mdx/types';
import { SiteX } from '../site-x';
import { createBaseMdxComponents } from './features/base';
import { createWidgetMdxComponents } from './features/widgets';

export type SiteMdxFeatureComponents = MDXComponents;

export interface SiteMdxBaseOptions {
  imageFallbackSrc?: string;
  cdnBaseUrl?: string;
}

export interface CreateSiteMdxComponentsOptions {
  baseOptions?: SiteMdxBaseOptions;
  features?: SiteMdxFeatureComponents[];
  additionalComponents?: MDXComponents;
}

const defaultFumaUiComponents: MDXComponents = {
  Callout,
  File,
  Folder,
  Files,
  Accordion,
  Accordions,
  Tab,
  Tabs,
};

export function createSiteMdxBaseComponents(
  options: SiteMdxBaseOptions = {},
): MDXComponents {
  return {
    ...defaultFumaUiComponents,
    SiteX,
    ...createBaseMdxComponents(options.imageFallbackSrc),
    ...createWidgetMdxComponents(options.cdnBaseUrl, options.imageFallbackSrc),
  };
}

export function createSiteMdxComponents(
  options: CreateSiteMdxComponentsOptions = {},
) {
  const {
    additionalComponents,
    baseOptions,
    features = [],
  } = options;

  return function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
      ...createSiteMdxBaseComponents(baseOptions),
      ...features.reduce<MDXComponents>((acc, feature) => ({ ...acc, ...feature }), {}),
      ...additionalComponents,
      ...components,
    };
  };
}
