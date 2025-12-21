'use client';

import { useState } from 'react';

interface FooterEmailProps {
  email: string;
  clickToCopyText?: string;
  copiedText?: string;
  children: React.ReactNode;
}

export function FooterEmail({ email, clickToCopyText, copiedText, children }: FooterEmailProps) {
  const [copied, setCopied] = useState(false);

  const displayTitle = clickToCopyText || 'Click to copy';
  const displayCopied = copiedText || 'Copied!';

  const handleCopy = async (e: React.MouseEvent) => {
    // Prevent default to allow long press on mobile
    e.preventDefault();
    
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  };

  return (
    <div className="relative group">
      <div className="absolute right-0 sm:right-auto sm:left-2/3 sm:-translate-x-1/4 bottom-full pb-1 hidden group-hover:block z-10">
        <div 
          className="bg-zinc-600 text-white text-xs rounded px-3 py-1 whitespace-nowrap shadow-lg cursor-pointer select-text"
          onMouseDown={handleCopy}
          title={displayTitle}
        >
          {copied ? displayCopied : email}
        </div>
      </div>
      <a
        href={`mailto:${email}`}
        className="flex items-center space-x-1 underline cursor-pointer px-2"
      >
        {children}
      </a>
    </div>
  );
}
