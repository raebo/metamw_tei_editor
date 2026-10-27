import { parseLetterLifecycle } from '@src/schemas/editorLetterLifecycle';

describe('parseLetterLifecycle', () => {
  it('maps the documented snake-case capability response', () => {
    expect(
      parseLetterLifecycle({
        version: 'b'.repeat(64),
        capabilities: {
          rename: { allowed: false, reason_code: 'letter_already_published' },
          discard: { allowed: true, reason_code: null },
        },
      }),
    ).toEqual({
      version: 'b'.repeat(64),
      capabilities: {
        rename: { allowed: false, reasonCode: 'letter_already_published' },
        discard: { allowed: true, reasonCode: null },
      },
    });
  });

  it('rejects unknown reason codes and allowed actions with a blocking reason', () => {
    expect(() =>
      parseLetterLifecycle({
        version: 'b'.repeat(64),
        capabilities: {
          rename: { allowed: false, reason_code: 'unknown_reason' },
          discard: { allowed: true, reason_code: null },
        },
      }),
    ).toThrow();
    expect(() =>
      parseLetterLifecycle({
        version: 'b'.repeat(64),
        capabilities: {
          rename: { allowed: true, reason_code: 'letter_already_published' },
          discard: { allowed: true, reason_code: null },
        },
      }),
    ).toThrow();
  });
});
