'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { baseMarkdownComponents } from '../fuma/share/markdown-component-map';
import { useMemo } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { AIMarkdownComponentMap, AIMarkdownProps } from './types';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype);

const defaultComponents: AIMarkdownComponentMap = baseMarkdownComponents;

export function AIMarkdown({ content, className, components }: AIMarkdownProps) {
  const tree = useMemo(() => {
    return processor.runSync(processor.parse(content));
  }, [content]);

  const element = useMemo(() => {
    return toJsxRuntime(tree, {
      Fragment,
      jsx,
      jsxs,
      components: {
        ...defaultComponents,
        ...(components ?? {}),
      },
      elementAttributeNameCase: 'html',
      stylePropertyNameCase: 'css',
    });
  }, [components, tree]);

  return (
    <div className={cn('space-y-4 text-sm text-inherit', className)}>
      {element}
    </div>
  );
}
