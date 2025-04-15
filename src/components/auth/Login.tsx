import React from 'react';
import Auth from "./Auth";
import { useLocation, useNavigate } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";

const Login = () => {
  const location = useLocation()
  const comingFrom= location.state?.from?.pathname || "/";
  const { login, error } = useLogin();

  return (
    <>
      <Auth
        submitLabel={"Login"}
        onSubmit={(request) =>
          login(request, comingFrom)

        }
        error={error}
      >
      </Auth>
    </>
  )
}

export default Login;
