import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { SerializedCompileResult } from '../md/render-shared';

export interface BuiltSourcePageEntry {
  path: string;
  absolutePath: string;
  title: string;
  description?: string;
  icon?: string;
  frontmatter: Record<string, unknown>;
  toc?: any[];
  structuredData?: StructuredData;
  compiled: SerializedCompileResult;
}

export interface BuiltSourceMetaEntry {
  path: string;
  absolutePath: string;
  data: Record<string, unknown>;
}

export interface BuiltSourceModuleArtifact {
  sourceKey: string;
  dir: string;
  pages: BuiltSourcePageEntry[];
  metas: BuiltSourceMetaEntry[];
}

export interface BuiltSourceManifestEntry {
  sourceKey: string;
  importPath: string;
}
