import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5B5F73]/10 dark:bg-[#5B5F73]/20 mb-6">
        <Icon className="h-10 w-10 text-[#5B5F73] dark:text-[#9499AD]" />
      </div>
      <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F3F4F6] mb-2">{title}</h3>
      <p className="text-sm text-[#5B5F73] dark:text-[#9499AD] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
