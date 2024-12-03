import { API_URL } from '../constants/url';
import { useState } from 'react';
import { enqueueSnackbar } from "notistack";
import { UNKNOWN_ERROR_MESSAGE } from "../constants/errors";
import { authenticatedVar } from "../constants/authenticated";
import { setToken } from "../services/authentication.service";
import { loginState } from "../redux/slices/user.slice";
import { useDispatch } from "react-redux";
import { getMe } from "../services/user.service";

interface LoginRequest {
  email: string;
  password: string;
}

const useLogin = () => {
  const [error, setError] = useState<string>();

  const setAuthenticated = () => authenticatedVar.set(true)

  const enqueueSnack = (message: string, type: "error" | "success") => {
    enqueueSnackbar(message, { variant: type });
  }
  const dispatch = useDispatch();

  const handleStateLogin = ({data = {last_name: String(), first_name: String()}}: {
    data?: { last_name: String; first_name: String }
  }) => {
    if (!data.first_name || !data.last_name) {
      return;
    }

    dispatch(loginState(data));
  };


  const getMeData = () => {
    getMe()
      .then( (data)  => {
        if (data !== null) {
          handleStateLogin({data: data})
        }
      })
      .catch(err => {
        console.error('Error:', err);
      });
  }

  const login = async (request: LoginRequest, redirectAfter: any) => {
    const response = await fetch(
      `${API_URL}/jwt_auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
    if (!response.ok) {
      if (response.status === 401) {
        enqueueSnack("Invalid credentials", "error" );
      } else {
        enqueueSnack(UNKNOWN_ERROR_MESSAGE, "error" );
      }
      return
    }

    const data = await response.json();
    setError("");
    enqueueSnack("You have successfully logged in!", "success" );
    // handleStateLogin()
    setToken(data.token)
    setAuthenticated()
    getMeData()
  };
  
  return { login, error };
}

export { useLogin }