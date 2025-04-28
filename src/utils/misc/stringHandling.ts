export const stringHandling = {
  removeLastCharIfSemiconlon: (str: string) => {
    if (str.slice(-1) === ';') {
      return str.slice(0, -1);
    }
    return str;
  },
  highlightText: (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi'); // `g` for global, `i` for case-insensitive
    const parts = text.split(regex);

    return parts
      .map((part) =>
        regex.test(part)
          ? `<span style="font-weight: 700; background-color: yellow;">${part}</span>`
          : part
      )
      .join('');
  }
}
