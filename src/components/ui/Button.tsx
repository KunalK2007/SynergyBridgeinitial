import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C7A4C]/50 focus-visible:border-[#9C7A4C] disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[#9C7A4C] text-white hover:bg-[#7A6039]': variant === 'default',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'border border-[#5B5F73] bg-transparent hover:bg-[#F6F5F2] text-[#1C1C1E] dark:text-[#F3F4F6] dark:hover:bg-[#1A1E2E] dark:border-[#2E3350]': variant === 'outline',
            'bg-[#5B5F73] text-white hover:bg-[#5B5F73]/80': variant === 'secondary',
            'hover:bg-[#F6F5F2] text-[#1C1C1E] dark:text-[#F3F4F6] dark:hover:bg-[#1A1E2E]': variant === 'ghost',
            'text-[#9C7A4C] underline-offset-4 hover:underline': variant === 'link',
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-9 rounded-md px-3 text-xs': size === 'sm',
            'h-11 rounded-md px-8 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
