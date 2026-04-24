import { defineMdxCapabilities, type MdxCapability } from '@windrun-huaiin/contracts/mdx';

export const ddaasMdxCapabilities = defineMdxCapabilities([
  'base',
  'code',
  'math',
  'mermaid',
  'type-table',
  'npm',
] as const satisfies readonly MdxCapability[]);
