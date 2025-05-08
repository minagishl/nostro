import { LucideIcon } from 'lucide-react';

type HeadProps = {
  icon: LucideIcon;
  title: string;
};

export function Head({ icon: Icon, title }: HeadProps) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 p-2 px-4 text-gray-100 dark:border-gray-700 dark:text-gray-100">
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </div>
  );
}
