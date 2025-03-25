import initApi from "./apiRequest.service";

const getMe = async () : Promise< { last_name: string, first_name: string, id: number, login: string } | undefined>  => {
  const response = await initApi.initApi().get('/jwt_auth/me')

  return response.data;
}

export { getMe };
