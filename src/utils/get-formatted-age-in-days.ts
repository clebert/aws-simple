import {getAgeInDays} from './get-age-in-days';

export function getFormattedAgeInDays(date: Date): string {
  const ageInDays = getAgeInDays(date);

  return `${ageInDays} day${
    ageInDays === 1 ? `` : `s`
  } ago (${date.toLocaleDateString()})`;
}
