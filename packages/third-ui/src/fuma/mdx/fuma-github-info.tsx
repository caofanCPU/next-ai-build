'use client';

import { useEffect, useState } from 'react';
import { ExternalLinkIcon, StarIcon } from '@windrun-huaiin/base-ui/icons';

interface FumaGithubInfoProps {
  owner: string;
  repo: string;
  token?: string;
  className?: string;
}

interface GitHubRepoData {
  stargazers_count: number;
  forks_count: number;
}

// Loading state component
function GitHubInfoSkeleton({ owner, repo, className }: Pick<FumaGithubInfoProps, 'owner' | 'repo' | 'className'>) {
  return (
    <div className={`flex flex-col gap-1.5 p-2 rounded-lg text-sm text-fd-foreground/80 lg:flex-row lg:items-center animate-pulse ${className}`}>
      <div className="flex items-center gap-2">
        <div className="size-3.5 bg-fd-muted rounded"></div>
        <div className="h-4 bg-fd-muted rounded w-20"></div>
      </div>
      <div className="h-3 bg-fd-muted rounded w-8"></div>
    </div>
  );
}

// Error state component - graceful fallback
function GitHubInfoFallback({ owner, repo, className }: Pick<FumaGithubInfoProps, 'owner' | 'repo' | 'className'>) {
  return (
    <a
      href={`https://github.com/${owner}/${repo}`}
      rel="noreferrer noopener"
      target="_blank"
      className={`flex flex-col gap-1.5 p-2 rounded-lg text-sm text-fd-foreground/80 transition-colors lg:flex-row lg:items-center hover:text-fd-accent-foreground hover:bg-fd-accent ${className}`}
    >
      <p className="flex items-center gap-2 truncate">
        <svg fill="currentColor" viewBox="0 0 24 24" className="size-3.5">
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
        {owner}/{repo}
      </p>
      <p className="flex text-xs items-center gap-1 text-fd-muted-foreground">
        <ExternalLinkIcon className="size-3" />
        GitHub
      </p>
    </a>
  );
}

// Success state component
function GitHubInfoSuccess({ 
  owner, 
  repo, 
  stars, 
  className 
}: Pick<FumaGithubInfoProps, 'owner' | 'repo' | 'className'> & { stars: number }) {
  const humanizedStars = humanizeNumber(stars);

  return (
    <a
      href={`https://github.com/${owner}/${repo}`}
      rel="noreferrer noopener"
      target="_blank"
      className={`flex flex-col gap-1.5 p-2 rounded-lg text-sm text-fd-foreground/80 transition-colors lg:flex-row lg:items-center hover:text-fd-accent-foreground hover:bg-fd-accent ${className}`}
    >
      <p className="flex items-center gap-2 truncate">
        <svg fill="currentColor" viewBox="0 0 24 24" className="size-3.5">
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
        {owner}/{repo}
      </p>
      <p className="flex text-xs items-center gap-1 text-fd-muted-foreground">
        <StarIcon className="size-3" />
        {humanizedStars}
      </p>
    </a>
  );
}

/**
 * Humanize number display
 */
function humanizeNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 100000) {
    const value = (num / 1000).toFixed(1);
    const formattedValue = value.endsWith('.0') ? value.slice(0, -2) : value;
    return `${formattedValue}K`;
  }

  if (num < 1000000) {
    return `${Math.floor(num / 1000)}K`;
  }

  return num.toString();
}

/**
 * GitHub repository information component with graceful fallback
 * 
 * Features:
 * - 🛡️ Client-side rendering, avoiding server-side network issues
 * - ⏱️ 5 second timeout control
 * - 🎯 Graceful fallback: display basic link when network fails
 * - 🎨 Three states: loading, success, error
 * - 💯 Not affected by network issues causing page crashes
 */
export function FumaGithubInfo({ owner, repo, token, className }: FumaGithubInfoProps) {
  const [data, setData] = useState<GitHubRepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepoData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout control
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const headers = new Headers({
          'Accept': 'application/vnd.github.v3+json',
        });

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          signal: controller.signal,
          headers,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`GitHub API response error: ${response.status}`);
        }

        const repoData = await response.json();
        setData({
          stargazers_count: repoData.stargazers_count,
          forks_count: repoData.forks_count,
        });
      } catch (err) {
        console.warn('GitHub API call failed:', err);
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError('Request timeout');
          } else {
            setError('Failed to get repository information');
          }
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRepoData();
  }, [owner, repo, token]);

  // Loading state
  if (loading) {
    return <GitHubInfoSkeleton owner={owner} repo={repo} className={className} />;
  }

  // Error state - graceful fallback
  if (error || !data) {
    return <GitHubInfoFallback owner={owner} repo={repo} className={className} />;
  }

  // Success state
  return (
    <GitHubInfoSuccess 
      owner={owner} 
      repo={repo} 
      stars={data.stargazers_count} 
      className={className} 
    />
  );
} 
