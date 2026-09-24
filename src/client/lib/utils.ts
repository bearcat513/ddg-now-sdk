/**
 * Class-name merging, copied from the Bun app's `lib/utils.ts`.
 *
 * `clsx` resolves the conditionals and `tailwind-merge` settles the conflicts
 * that result — a component's own `px-3` and a caller's `px-2` are the same
 * property, and without this the one that wins is whichever Tailwind happened
 * to emit last rather than the one the caller asked for.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
