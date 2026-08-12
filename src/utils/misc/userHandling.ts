import { AuthUser } from '@src/services/mappings/authMappings';

// Only the name fields nameShortCut actually needs - the Redux auth slice's user does not carry
// AuthUser's full shape (no email/language), so requiring a full AuthUser here would either
// force a fake one or (as before) silently mismatch names/casing at runtime.
type NamePartsUser = Pick<AuthUser, 'first_name' | 'last_name'>;

// Matches the (unexported) user shape of src/redux/slices/authentication.slice.ts.
type StateUser = { id: number; login: string; firstName: string; lastName: string } | null;

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
      first_name: stateUser?.firstName ?? '',
      last_name: stateUser?.lastName ?? '',
    };
  },
};
