import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import type { MDXComponents } from 'mdx/types';
import {
  createBaseMdxComponents,
  createCodeMdxComponents,
  createMathMdxComponents,
  createMermaidMdxComponents,
  createTypeTableMdxComponents,
  createWidgetMdxComponents,
} from './optional-features';
import { SiteX } from '../site-x';
import type { SiteMdxComponentsOptions } from './site-mdx-components';
import type { SiteMdxFeature } from '@windrun-huaiin/contracts/mdx';

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

export const DEFAULT_SITE_MDX_FEATURES: SiteMdxFeature[] = [
  'base',
  'code',
  'math',
  'mermaid',
  'type-table',
];

export function createSiteFeatureComponentMap(
  options: SiteMdxComponentsOptions,
) {
  const {
    cdnBaseUrl,
    iconMap = {},
    imageFallbackSrc,
    watermarkEnabled,
    watermarkText,
  } = options;

  return {
    base: {
      ...defaultFumaUiComponents,
      SiteX,
      ...createBaseMdxComponents(imageFallbackSrc),
      ...createWidgetMdxComponents(cdnBaseUrl, imageFallbackSrc),
    },
    code: createCodeMdxComponents(iconMap),
    math: createMathMdxComponents(),
    mermaid: createMermaidMdxComponents(watermarkEnabled, watermarkText),
    'type-table': createTypeTableMdxComponents(),
  } satisfies Record<SiteMdxFeature, MDXComponents>;
}

export function composeSiteMdxComponents(
  features: readonly SiteMdxFeature[],
  featureMap: Record<SiteMdxFeature, MDXComponents>,
  additionalComponents?: MDXComponents,
  components?: MDXComponents,
): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...features.reduce<MDXComponents>((acc, feature) => {
      return {
        ...acc,
        ...featureMap[feature],
      };
    }, {}),
    ...additionalComponents,
    ...components,
  };
}
