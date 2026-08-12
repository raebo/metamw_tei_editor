import { stringHandling } from '@src/utils/misc/stringHandling';

describe('stringHandling.splitByQuery', () => {
  it('returns the whole input as a single non-matched segment when there is no query', () => {
    expect(stringHandling.splitByQuery('Anna Mustermann', '')).toEqual([
      { text: 'Anna Mustermann', matched: false },
    ]);
  });

  it('splits around a single case-insensitive match, preserving the original casing', () => {
    expect(stringHandling.splitByQuery('Anna Mustermann', 'anna')).toEqual([
      { text: 'Anna', matched: true },
      { text: ' Mustermann', matched: false },
    ]);
  });

  it('marks every occurrence of the query as a separate matched segment', () => {
    expect(stringHandling.splitByQuery('Anna Anna', 'anna')).toEqual([
      { text: 'Anna', matched: true },
      { text: ' ', matched: false },
      { text: 'Anna', matched: true },
    ]);
  });

  it('returns the input unmatched when the query does not occur', () => {
    expect(stringHandling.splitByQuery('Anna Mustermann', 'xyz')).toEqual([
      { text: 'Anna Mustermann', matched: false },
    ]);
  });

  it('escapes regex special characters in the query instead of throwing', () => {
    expect(stringHandling.splitByQuery('Cost: 5€ (approx.)', '(approx.)')).toEqual([
      { text: 'Cost: 5€ ', matched: false },
      { text: '(approx.)', matched: true },
    ]);
  });

  // Regression: the previous implementation built an HTML string
  // (`${part}<span ...>${query}</span>`) that was rendered via dangerouslySetInnerHTML,
  // letting untrusted backend text (entity names, letter titles, ...) inject markup. The
  // segment-based API returns plain data - no HTML is ever constructed here, so the XSS payload
  // simply comes back as ordinary text content for the caller to render as a React node.
  it('treats HTML-looking input as plain text instead of building markup', () => {
    const payload = '<img src=x onerror=alert(1)>Anna';

    const segments = stringHandling.splitByQuery(payload, 'anna');

    expect(segments).toEqual([
      { text: '<img src=x onerror=alert(1)>', matched: false },
      { text: 'Anna', matched: true },
    ]);
    // None of the segments contain HTML markup - they are the raw, unescaped substrings of the
    // input, safe to hand to React (which escapes text children automatically).
    expect(segments.every((segment) => typeof segment.text === 'string')).toBe(true);
  });
});
