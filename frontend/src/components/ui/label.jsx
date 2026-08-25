import { cn } from '@/lib/utils';

// Plain styled label (shadcn wraps @radix-ui/react-label; native <label> is enough here).
export function Label({ className, ...props }) {
  return <label className={cn('text-sm font-medium text-neutral-700', className)} {...props} />;
}
