import type { LocalMdxFeature, SiteMdxFeature } from './features';

export type MdxCapability =
  | 'base'
  | 'code'
  | 'math'
  | 'mermaid'
  | 'type-table'
  | 'npm'
  | 'steps'
  | 'fuma-ui'
  | 'widgets';

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
      capability === 'npm' ||
      capability === 'steps',
  );
}

export function toSiteMdxFeatures(
  capabilities: readonly MdxCapability[],
): SiteMdxFeature[] {
  return capabilities.filter(
    (capability): capability is SiteMdxFeature =>
      capability === 'base' ||
      capability === 'code' ||
      capability === 'math' ||
      capability === 'mermaid' ||
      capability === 'type-table' ||
      capability === 'fuma-ui' ||
      capability === 'widgets',
  );
}
