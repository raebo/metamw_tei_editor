export const misc = {
  getErrorMessage: (error: unknown): string => {
    return error instanceof Error ? error.message : String(error);
  }
}
