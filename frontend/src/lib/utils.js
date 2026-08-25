import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn's class helper: merge conditional classes, dedupe conflicting Tailwind utilities.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
