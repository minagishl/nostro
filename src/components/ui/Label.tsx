import { tv } from 'tailwind-variants';
import { LabelHTMLAttributes } from 'react';

const labelStyles = tv({
  base: 'block text-sm font-medium text-gray-700 dark:text-gray-300',
});

type LabelProps = {
  children: React.ReactNode;
} & LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label className={labelStyles({ className })} {...props}>
      {children}
    </label>
  );
}
