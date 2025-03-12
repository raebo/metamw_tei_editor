import { jwtDecode  } from 'jwt-decode';

export const isTokenValid = (token: string) => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 > Date.now(); // Check if token is expired
  } catch (e) {
    return false;
  }
};
