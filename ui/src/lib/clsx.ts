export function clsx(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
