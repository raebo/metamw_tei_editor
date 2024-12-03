import apiRequest from "./apiRequest.service";
import initApi from "./apiRequest.service";
import { enqueueSnackbar } from "notistack";

const getMe = async () : Promise< { last_name: String, first_name: String } | undefined>  => {
  let response = null
  try {
    response = await initApi.initApi().get('/jwt_auth/me')

    return response.data;
  } catch (err) {
    enqueueSnackbar("An error occurred while fetching user data", { variant: 'error' });
  }
}

const handlePost = async () => {
  const data = { username: 'JohnDoe', password: '123456' };
  try {
    const response = await apiRequest.apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error(err);
  }
}

export { getMe, handlePost };
