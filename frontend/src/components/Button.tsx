import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', children, fullWidth, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#FF7A00] text-white hover:bg-[#E66D00] active:scale-95',
    secondary: 'bg-[#1E1E1E] dark:bg-[#2E2E2E] text-white hover:bg-[#2E2E2E] dark:hover:bg-[#3E3E3E] active:scale-95',
    outline: 'border-2 border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white active:scale-95'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}