/** Joins class names, skipping falsy values. Tiny clsx, no dependency. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
