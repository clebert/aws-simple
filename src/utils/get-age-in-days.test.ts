import {getAgeInDays} from './get-age-in-days.js';

describe(`getAgeInDays()`, () => {
  test(`returns the age in days`, () => {
    expect(getAgeInDays(new Date())).toBe(0);

    const today = new Date(`Oct 9 2019 14:00`);

    expect(getAgeInDays(today, today)).toBe(0);

    expect(getAgeInDays(new Date(`Oct 8 2019 15:00`), today)).toBe(0);
    expect(getAgeInDays(new Date(`Oct 8 2019 14:00`), today)).toBe(1);
    expect(getAgeInDays(new Date(`Oct 8 2019 13:00`), today)).toBe(1);

    expect(getAgeInDays(new Date(`Oct 7 2019 15:00`), today)).toBe(1);
    expect(getAgeInDays(new Date(`Oct 7 2019 14:00`), today)).toBe(2);
    expect(getAgeInDays(new Date(`Oct 7 2019 13:00`), today)).toBe(2);

    expect(getAgeInDays(new Date(`Sep 25 2019 15:00`), today)).toBe(13);
    expect(getAgeInDays(new Date(`Sep 25 2019 14:00`), today)).toBe(14);
    expect(getAgeInDays(new Date(`Sep 25 2019 13:00`), today)).toBe(14);

    expect(getAgeInDays(new Date(`Oct 10 2019 15:00`), today)).toBe(-2);
    expect(getAgeInDays(new Date(`Oct 10 2019 14:00`), today)).toBe(-1);
    expect(getAgeInDays(new Date(`Oct 10 2019 13:00`), today)).toBe(-1);
  });
});
