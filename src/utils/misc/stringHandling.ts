function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const stringHandling = {
  highlightText: (input: string, query: string) => {
    if (!query) return input;

    let regex: RegExp;
    try {
      regex = new RegExp(escapeRegExp(query), 'gi'); // safely escape query
    } catch (e) {
      console.warn('Invalid regex pattern:', e);
      return input;
    }

    const parts = input.split(regex);

    return parts
      .map((part, i) =>
        i < parts.length - 1
          ? `${part}<span style="font-weight: 700; background-color: yellow;">${query}</span>`
          : part,
      )
      .join('');
  },
};
