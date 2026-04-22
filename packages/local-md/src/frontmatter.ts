import { parse as parseYaml } from 'yaml';

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export function parseFrontmatter(input: string): ParsedFrontmatter {
  const match = FRONTMATTER_RE.exec(input);
  if (!match) {
    return {
      data: {},
      content: input,
    };
  }

  const parsed = parseYaml(match[1]);
  if (parsed != null && (typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error('frontmatter must be an object');
  }

  return {
    data: (parsed ?? {}) as Record<string, unknown>,
    content: input.slice(match[0].length),
  };
}
