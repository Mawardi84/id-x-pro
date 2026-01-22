import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronRight } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide",
          {
            'bg-cyan-600 text-black font-bold hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-400/50': variant === 'default',
            'bg-red-900/50 border border-red-500/50 text-red-200 hover:bg-red-900/80 hover:border-red-400': variant === 'destructive',
            'border border-cyan-800/50 bg-[#020617]/50 hover:bg-cyan-950/50 text-cyan-100 hover:border-cyan-500/50': variant === 'outline',
            'bg-slate-800 text-slate-100 hover:bg-slate-700': variant === 'secondary',
            'hover:bg-cyan-900/20 text-cyan-100 hover:text-cyan-400': variant === 'ghost',
            'text-cyan-400 underline-offset-4 hover:underline': variant === 'link',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-cyan-900/30 bg-[#0b1221]/80 backdrop-blur-sm text-cyan-50 shadow-lg shadow-black/50", className)} {...props} />
));
Card.displayName = "Card";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
  const isColor = type === 'color';
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-cyan-900/50 bg-[#020617]/50 text-sm ring-offset-[#020617] file:border-0 file:bg-transparent file:text-sm file:font-medium text-cyan-50 placeholder:text-cyan-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        // Conditional padding: remove padding for color inputs to allow swatch to fill area
        isColor ? "p-1 cursor-pointer" : "px-3 py-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-cyan-300/70 uppercase tracking-wider mb-1.5 block", className)} {...props} />
));
Label.displayName = "Label";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <div className="relative">
    <select
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-cyan-900/50 bg-[#020617]/50 px-3 py-2 text-sm placeholder:text-cyan-900/50 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-cyan-50",
        className
      )}
      ref={ref}
      {...props}
    />
    <ChevronRight className="absolute right-3 top-3 h-4 w-4 rotate-90 opacity-50 pointer-events-none text-cyan-500" />
  </div>
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-cyan-900/50 bg-[#020617]/50 px-3 py-2 text-sm placeholder:text-cyan-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 text-cyan-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";