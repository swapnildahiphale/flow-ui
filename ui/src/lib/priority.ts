export const PRIORITY_VARIANT = { high: 'rose', medium: 'neutral', low: 'outline' } as const;
export type Priority = keyof typeof PRIORITY_VARIANT;
