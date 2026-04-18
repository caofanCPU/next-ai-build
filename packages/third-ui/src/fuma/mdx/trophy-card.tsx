'use client';

import { StarIcon } from '@windrun-huaiin/base-ui/icons';
import React from 'react';

export function TrophyCard({
  icon = <StarIcon />,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="
        border-2 rounded-xl px-4 py-2
        border-purple-200 dark:border-gray-500
      "
    >
      <div className="flex items-center font-bold text-sm">
        <span className="mr-2">{icon}</span>
        <span>{title}</span>
      </div>
      {/* leading-none：line-height: 1
      leading-tight：line-height: 1.25
      leading-snug：line-height: 1.375
      leading-normal：line-height: 1.5
      leading-relaxed：line-height: 1.625
      leading-loose：line-height: 2 */}
      <div className="text-sm -mt-1 leading-none">
        {children}
      </div>
    </div>
  );
}