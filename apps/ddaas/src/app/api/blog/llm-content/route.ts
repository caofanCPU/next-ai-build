 

import { type NextRequest, NextResponse } from 'next/server';

import { blogSource } from '@/lib/source-blog';
import { appConfig } from '@/lib/appConfig';
import { LLMCopyHandler } from '@third-ui/fuma/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') ?? appConfig.i18n.defaultLocale;
  const requestedPath = searchParams.get('path') || '';

  const result = await LLMCopyHandler({
    sourceDir: appConfig.mdxSourceDir.blog,
    dataSource: blogSource,
    requestedPath,
    locale,
  });

  if (result.error) {
    console.error(`API llm-content: ${result.error}`);
    return new NextResponse(result.error, { status: result.status });
  }
  return new NextResponse(result.text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}