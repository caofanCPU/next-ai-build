import type { LocalMdxFeature, SiteMdxFeature } from './features';

export type MdxCapability =
  | 'base'
  | 'code'
  | 'math'
  | 'mermaid'
  | 'type-table'
  | 'npm';

export function defineMdxCapabilities<const T extends readonly MdxCapability[]>(
  capabilities: T,
): T {
  return capabilities;
}

export function toLocalMdxFeatures(
  capabilities: readonly MdxCapability[],
): LocalMdxFeature[] {
  return capabilities.filter(
    (capability): capability is LocalMdxFeature =>
      capability === 'code' ||
      capability === 'math' ||
      capability === 'npm',
  );
}

export function toSiteMdxFeatures(
  capabilities: readonly MdxCapability[],
): SiteMdxFeature[] {
  const features = capabilities.filter(
    (capability): capability is SiteMdxFeature =>
      capability === 'base' ||
      capability === 'code' ||
      capability === 'math' ||
      capability === 'mermaid' ||
      capability === 'type-table',
  );

  return features.includes('base')
    ? features
    : ['base', ...features];
}
