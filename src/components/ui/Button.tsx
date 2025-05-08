import { tv } from 'tailwind-variants';
import { ButtonHTMLAttributes } from 'react';

const button = tv({
  base: 'cursor-pointer rounded-sm p-2.5 transition-colors font-semibold',
  variants: {
    isSelected: {
      true: 'bg-indigo-100 text-indigo-600',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
    variant: {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-indigo-500 bg-transparent text-indigo-600 hover:bg-indigo-50',
      ghost: 'bg-transparent text-indigo-600 hover:bg-gray-100',
    },
  },
});

type ButtonProps = {
  isSelected?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  isSelected,
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={button({ isSelected, variant, className })} {...props}>
      {children}
    </button>
  );
}
