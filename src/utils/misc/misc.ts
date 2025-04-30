function pickAttributes<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Pick<T, K>);
}


export const misc = {
  getErrorMessage: (error: unknown): string => {
    return error instanceof Error ? error.message : String(error);
  },
  pickAttributes
}
