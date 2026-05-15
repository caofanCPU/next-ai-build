 
 
import { type NextRequest, NextResponse } from 'next/server';

import { appConfig } from '@/lib/appConfig';
import { resolveMdxSourceDir } from '@/lib/mdx-source';
import { siteDocs } from '@/lib/site-docs';
import { LLMCopyHandler } from '@third-ui/fuma/server/llm-copy-handler';

const sourceKey = 'legal';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') ?? appConfig.i18n.defaultLocale;
  const requestedPath = searchParams.get('path') || '';
  const legalSource = await siteDocs.getContentSource(sourceKey);

  const result = await LLMCopyHandler({
    sourceDir: resolveMdxSourceDir(sourceKey),
    dataSource: legalSource,
    requestedPath,
    locale,
  });

  if (result.error) {
    console.error(`API llm-content: ${result.error}`);
    return new NextResponse(result.error, { status: result.status });
  }
  return new NextResponse(result.text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
