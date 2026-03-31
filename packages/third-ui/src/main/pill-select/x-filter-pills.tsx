'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { XPillSelect, type XPillOption } from './x-pill-select';

type XFilterPillsProps = {
  label: string;
  value: string;
  options: XPillOption[];
  onChange: (value: string) => void;
  allLabel: string;
  className?: string;
};

export function XFilterPills({
  label,
  value,
  options,
  onChange,
  allLabel,
  className,
}: XFilterPillsProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</div>
      <XPillSelect
        mode="single"
        value={value}
        onChange={onChange}
        options={[{ label: allLabel, value: '' }, ...options]}
        size="compact"
        maxPillWidthClassName="max-w-[150px] sm:max-w-[220px]"
      />
    </div>
  );
}
