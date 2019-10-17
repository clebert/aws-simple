export function plural(elementName: string, elements: unknown[]): string {
  return `${elementName}${elements.length === 1 ? '' : 's'}`;
}
