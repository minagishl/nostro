import { tv } from 'tailwind-variants';
import { InputHTMLAttributes } from 'react';

const inputStyles = tv({
  base: 'w-full rounded-md border px-3 py-2.5 focus:outline-none',
  variants: {
    variant: {
      default:
        'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const labelStyles = tv({
  base: 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
});

type InputProps = {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className={labelStyles()}>{label}</label>}
      <input
        className={inputStyles({
          variant: error ? 'error' : 'default',
          className,
        })}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
