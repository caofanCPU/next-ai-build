import React from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { themeRichTextMarkClass } from '@windrun-huaiin/base-ui/lib';

// default tag renderers
const defaultTagRenderers = {
  // text Stong
  strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  // text Emphasis
  em: (chunks: React.ReactNode) => <em>{chunks}</em>,
  // text Underline
  u: (chunks: React.ReactNode) => <u>{chunks}</u>,
  // text Mark
  mark: (chunks: React.ReactNode) => <mark className={cn(themeRichTextMarkClass, "text-neutral-800 dark:text-neutral-300 px-1 rounded")}>{chunks}</mark>,
  // text Delete
  del: (chunks: React.ReactNode) => <del>{chunks}</del>,
  // text Subscript
  sub: (chunks: React.ReactNode) => <sub>{chunks}</sub>,
  // text Superscript
  sup: (chunks: React.ReactNode) => <sup>{chunks}</sup>,
};

// custom tag renderers
type TagRenderer = (chunks: React.ReactNode) => React.ReactElement;
type TagRenderers = Record<string, TagRenderer>;

// create rich text renderer
export function createRichTextRenderer(customRenderers?: TagRenderers) {
  const renderers = { ...defaultTagRenderers, ...customRenderers };
  
  return function richText(t: any, key: string) {
    return t.rich(key, renderers);
  };
}

// default rich text renderer
export const richText = createRichTextRenderer();
