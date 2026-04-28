import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import type { MDXComponents } from 'mdx/types';
import { SiteX } from '../site-x';
import { createBaseMdxComponents } from './features/base';
import { createWidgetMdxComponents } from './features/widgets';
import { withMissingMdxComponentFallback } from './site-mdx-fallbacks';

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
  Card,
  Cards,
  Callout,
  File,
  Folder,
  Files,
  Accordion,
  Accordions,
  Tab,
  Tabs,
};

function withIconComponentAliases(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...Object.fromEntries(
      Object.entries(components).flatMap(([name, component]) => {
        if (!/^[A-Z]/.test(name)) return [];

        if (name.endsWith('Icon')) {
          return [[name.slice(0, -4), component] as const];
        }

        return [[`${name}Icon`, component] as const];
      }),
    ),
  };
}

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
    return withMissingMdxComponentFallback(withIconComponentAliases({
      ...createSiteMdxBaseComponents(baseOptions),
      ...features.reduce<MDXComponents>((acc, feature) => ({ ...acc, ...feature }), {}),
      ...additionalComponents,
      ...components,
    }));
  };
}
