import { AuthUser } from "../../services/mappings/authMappings";

export const userHandling = {
  nameShortCut : (user: AuthUser): string => {
    return `${user.last_name.charAt(0)}${user.first_name.charAt(0)}`
  },
  stateUserToAuthUser: (stateUser: any): AuthUser => {
    return {
      id: stateUser.id,
      last_name: stateUser.last_name,
      first_name: stateUser.first_name
    }
  }
}
