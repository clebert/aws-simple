export function getNormalizedName(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9]+/g, `-`);
}
