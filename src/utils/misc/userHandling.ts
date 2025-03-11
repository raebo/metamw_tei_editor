import { AuthUser } from "../../services/mappings/authMappings";

export const userHandling = {
  nameShortCut : (user: AuthUser): string => {
    if (user.last_name && user.first_name) {
      return `${user.last_name.charAt(0)}${user.first_name.charAt(0)}`

    } else if (user.login && user.login.indexOf('_') !== -1) {
      const split = user.login.split('_')
      return  `${split[0].charAt(0)}${split[1].charAt(0)}`

    } else if (user.login && user.login.length > 1) {
      return `${user.login.charAt(0)}${user.login.charAt(1)}`

    } else if (user.login) {
      return user.login.charAt(0)

    } else {
      throw new Error("User without name and login")
    }
  },
  stateUserToAuthUser: (stateUser: any): AuthUser => {
    return {
      id: stateUser.id,
      login: stateUser.login,
      last_name: stateUser.last_name,
      first_name: stateUser.first_name
    }
  }
}
