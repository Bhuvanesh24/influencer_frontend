import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's stock scale names. Without this, it files our custom
 * font-size classes (`text-h1`, `text-body`, …) under *text color* and silently drops them
 * whenever a real color class (`text-ink`) follows — so every custom name added to
 * tailwind.config.js's `fontSize` must be registered here too (likewise any custom
 * `borderRadius` name that isn't a stock t-shirt size).
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'h1', 'h2', 'h3', 'body', 'body-sm', 'caption'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
