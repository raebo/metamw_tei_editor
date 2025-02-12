export const stringHandling = {
  removeLastCharIfSemiconlon: (str: string) => {
    if (str.slice(-1) === ';') {
      return str.slice(0, -1);
    }
    return str;
  }
}
