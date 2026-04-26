/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'node:fs';
import nodePath from 'node:path';
import { getLLMText } from '@windrun-huaiin/lib/llm-utils';

export type LLMCopyHandlerOptions = {
  // for example: "src/mdx/blog"
  sourceDir: string;
  // data source object, like blogSource, legalSource
  dataSource: {
    getPage: (slug: string[], locale: string) => any | undefined;
  };
  // for example: "blog/2025/07/07/test"
  requestedPath?: string;
  locale: string;
};

/**
 * General MDX content reading and processing tool function, logs are consistent with router.
 */
export async function LLMCopyHandler(options: LLMCopyHandlerOptions): Promise<{ text?: string; error?: string; status: number }> {
  const { sourceDir, dataSource, requestedPath, locale } = options;
  const slug = requestedPath?.split('/') || [];

  try {
    const page = dataSource.getPage(slug, locale);

    if (!page) {
      console.error(`[LLMCopy] Page or page data not found for locale=${locale}, path=${requestedPath}`);
      return { error: 'Page data not found', status: 404 };
    }
    if (!page.path) {
      console.error(`[LLMCopy] file path information missing in page data for locale=${locale}, path=${requestedPath}`);
      return { error: 'Page file path information missing', status: 500 };
    }

    const title = page.data?.title ?? page.title;
    const description = page.data?.description ?? page.description;
    const relativeMdxFilePath = page.path;
    const absoluteFilePath = nodePath.join(process.cwd(), sourceDir, relativeMdxFilePath);

    let mdxContent: string;
    try {
      mdxContent = fs.readFileSync(absoluteFilePath, 'utf-8');
    } catch (readError: any) {
      console.error(`[LLMCopy] Failed to read file at: ${absoluteFilePath}. Error: ${readError.message}`);
      console.error('[LLMCopy] Read Error object details:', JSON.stringify(readError, Object.getOwnPropertyNames(readError), 2));
      // directory traversal debug logs
      try {
        const srcPath = nodePath.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
          console.log(`[LLMCopy] src dir contents: ${fs.readdirSync(srcPath).join(', ')}`);
          const srcMdxPath = nodePath.join(process.cwd(), 'src', 'mdx');
          if (fs.existsSync(srcMdxPath)) {
            console.log(`[LLMCopy] src/mdx dir contents: ${fs.readdirSync(srcMdxPath).join(', ')}`);
            const srcMdxDocsPath = nodePath.join(process.cwd(), sourceDir);
            if (fs.existsSync(srcMdxDocsPath)) {
                console.log(`[LLMCopy] ${sourceDir} dir contents: ${fs.readdirSync(srcMdxDocsPath).join(', ')}`);
            }
          }
        }
      } catch (listDirError: any) {
        console.warn(`[LLMCopy] Could not list directory contents for debugging: ${listDirError.message}`);
      }
      return { error: `Error reading MDX file: ${readError.message}`, status: 500 };
    }

    try {
      const text = await getLLMText(mdxContent, title, description);
      return { text, status: 200 };
    } catch (error: any) {
      console.error(`[LLMCopy] Error processing MDX content for locale=${locale}, path=${requestedPath}:`, error);
      console.error('[LLMCopy] General Error object details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      return { error: 'Error processing MDX content', status: 500 };
    }
  } catch (error: any) {
    console.error(`[LLMCopy] General error for locale=${locale}, path=${requestedPath}:`, error);
    console.error('[LLMCopy] General Error object details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return { error: 'Internal Server Error', status: 500 };
  }
} 
