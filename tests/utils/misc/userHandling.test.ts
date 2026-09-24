import { userHandling } from '@src/utils/misc/userHandling';

describe('userHandling.responsibilityIdentifier', () => {
  it('uses name initials when both name parts are available', () => {
    expect(
      userHandling.responsibilityIdentifier({
        id: 1,
        login: 'tester@example.org',
        firstName: 'Test',
        lastName: 'Bearbeiter',
      }),
    ).toBe('BT');
  });

  it('falls back to the login for users without complete names', () => {
    expect(
      userHandling.responsibilityIdentifier({
        id: 1,
        login: 'tester@example.org',
        firstName: '',
        lastName: '',
      }),
    ).toBe('tester@example.org');
  });

  it('supports a backend-shaped user during an existing session', () => {
    expect(
      userHandling.responsibilityIdentifier({
        id: 2,
        email: 'legacy@example.org',
        first_name: '',
        last_name: '',
      }),
    ).toBe('legacy@example.org');
  });

  it('uses a stable user ID when neither names nor login are available', () => {
    expect(userHandling.responsibilityIdentifier({ id: 42 })).toBe('user_42');
  });
});
