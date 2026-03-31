'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { XPillSelect, type XPillOption } from './x-pill-select';

type XFormPillsProps = {
  label: React.ReactNode;
  value: string;
  options: XPillOption[];
  onChange: (value: string) => void;
  emptyLabel: string;
  allowClear?: boolean;
  className?: string;
};

export function XFormPills({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  allowClear = false,
  className,
}: XFormPillsProps) {
  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <div className="font-medium text-slate-700 dark:text-slate-200">{label}</div>
      <XPillSelect
        mode="single"
        value={value}
        onChange={onChange}
        options={options}
        emptyLabel={emptyLabel}
        allowClear={allowClear}
        maxPillWidthClassName="max-w-[150px] sm:max-w-[220px]"
      />
    </div>
  );
}
