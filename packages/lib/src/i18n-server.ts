import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { deepMergeMessages } from './i18n-utils';

export interface RuntimeMessageFileSource {
  type: 'file';
  path?: string;
}

export interface RuntimeMessageDirectorySource {
  type: 'dir';
  path: string;
}

export type RuntimeMessageSource = RuntimeMessageFileSource | RuntimeMessageDirectorySource;

async function readMessageFile(filePath: string): Promise<Record<string, unknown>> {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as Record<string, unknown>;
}

async function collectLocaleFiles(dirPath: string, locale: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const nestedFiles = await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          return collectLocaleFiles(fullPath, locale);
        }

        return entry.isFile() && entry.name.endsWith(`.${locale}.json`) ? [fullPath] : [];
      })
    );

    return nestedFiles.flat().sort((left, right) => left.localeCompare(right));
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function loadMergedLocaleMessages(options: {
  locale: string;
  messagesRoot: string;
  sources: readonly RuntimeMessageSource[];
}): Promise<Record<string, unknown>> {
  const { locale, messagesRoot, sources } = options;

  let mergedMessages: Record<string, unknown> = {};

  for (const source of sources) {
    if (source.type === 'file') {
      const filePath = source.path
        ? path.join(messagesRoot, source.path, `${locale}.json`)
        : path.join(messagesRoot, `${locale}.json`);
      const fileMessages = await readMessageFile(filePath);
      mergedMessages = deepMergeMessages(mergedMessages, fileMessages);
      continue;
    }

    const dirPath = path.join(messagesRoot, source.path);
    const filePaths = await collectLocaleFiles(dirPath, locale);

    for (const filePath of filePaths) {
      const fileMessages = await readMessageFile(filePath);
      mergedMessages = deepMergeMessages(mergedMessages, fileMessages);
    }
  }

  return mergedMessages;
}
