import { AuthUser } from '@src/services/mappings/authMappings';

// Only the name fields nameShortCut actually needs - the Redux auth slice's user does not carry
// AuthUser's full shape (no email/language), so requiring a full AuthUser here would either
// force a fake one or (as before) silently mismatch names/casing at runtime.
type NamePartsUser = Pick<AuthUser, 'first_name' | 'last_name'>;

// Accept both the normalized Redux shape and the legacy backend shape so an existing session can
// still create a stable responsibility identifier while the authentication state is refreshed.
type StateUser = {
  id: number;
  login?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
} | null;

export const userHandling = {
  nameShortCut: (user: NamePartsUser): string => {
    if (user.last_name && user.first_name) {
      return `${user.last_name.charAt(0)}${user.first_name.charAt(0)}`;
    } else {
      throw new Error('User without first/last name');
    }
  },
  stateUserToAuthUser: (stateUser: StateUser): NamePartsUser => {
    return {
      first_name: stateUser?.firstName ?? stateUser?.first_name ?? '',
      last_name: stateUser?.lastName ?? stateUser?.last_name ?? '',
    };
  },
  responsibilityIdentifier: (stateUser: StateUser): string => {
    if (!stateUser) throw new Error('No authenticated user');

    const nameParts = userHandling.stateUserToAuthUser(stateUser);
    if (nameParts.first_name?.trim() && nameParts.last_name?.trim()) {
      return userHandling.nameShortCut(nameParts);
    }

    const login = stateUser.login?.trim() || stateUser.email?.trim();
    return login || `user_${stateUser.id}`;
  },
};
