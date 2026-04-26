'use client';

import { EditOnGitHub, LastUpdatedDate } from './toc-base';
import React from 'react';

interface TocFooterProps {
  lastModified: string | undefined;
  editPath?: string;
  githubBaseUrl?: string;
  copyButtonComponent?: React.ReactNode;
}

export function TocFooterWrapper({ lastModified, editPath, githubBaseUrl, copyButtonComponent }: TocFooterProps) {
  const showEdit = githubBaseUrl && editPath;
  return (
    <div className="flex flex-col gap-y-2 items-start m-4">
      <LastUpdatedDate date={lastModified} />
      {copyButtonComponent}
      {showEdit && <EditOnGitHub url={`${githubBaseUrl}${editPath}`} />}
    </div>
  );
} 
