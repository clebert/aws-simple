export function getAgeInDays(date: Date, today: Date = new Date()): number {
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}
