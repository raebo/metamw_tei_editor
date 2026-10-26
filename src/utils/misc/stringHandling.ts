function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface TextSegment {
  text: string;
  matched: boolean;
}

const splitByPattern = (input: string, pattern: string): TextSegment[] => {
  if (!pattern) return [{ text: input, matched: false }];

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, 'gi');
  } catch {
    return [{ text: input, matched: false }];
  }

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index), matched: false });
    }
    segments.push({ text: match[0], matched: true });
    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) regex.lastIndex += 1;
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), matched: false });
  }

  return segments.length > 0 ? segments : [{ text: input, matched: false }];
};

export const stringHandling = {
  /**
   * Splits `input` into segments around case-insensitive matches of `query`, so callers can
   * render matches highlighted as React nodes instead of building an HTML string. Text content
   * is untrusted (e.g. backend-provided entity names) and must never be turned into HTML/
   * dangerouslySetInnerHTML; rendering the returned segments as plain React children keeps them
   * safely escaped.
   */
  splitByQuery: (input: string, query: string): TextSegment[] => {
    return splitByPattern(input, escapeRegExp(query));
  },

  splitByQueryTerms: (input: string, query: string): TextSegment[] => {
    const terms = Array.from(
      new Set(
        query
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((term) => term.toLowerCase()),
      ),
    ).sort((left, right) => right.length - left.length);

    return splitByPattern(input, terms.map(escapeRegExp).join('|'));
  },
};
