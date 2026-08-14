import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-[#5B5F73]/50 bg-[#F6F5F2] px-3 py-2 text-sm text-[#1C1C1E] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#5B5F73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C7A4C]/50 focus-visible:border-[#9C7A4C] disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 dark:bg-[#1A1E2E] dark:border-[#2E3350] dark:text-[#F3F4F6] dark:placeholder:text-[#6D7287]",
            error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
