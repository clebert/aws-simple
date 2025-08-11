export function print(): void {}

print.warning = (): void => {};

print.error = (): void => {};

print.confirmation = async (): Promise<boolean> => {
  return false;
};

print.listItem = (): void => {};

print.success = (): void => {};

print.info = (): void => {};
