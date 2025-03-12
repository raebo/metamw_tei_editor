import excludedRoutes from "../../constants/excluded-routes";
import { useAuth } from "./AuthContext";
import { isTokenValid } from "../../utils/auth";
import { loginSetToken, loginState, logoutState } from "../../redux/slices/authentication.slice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { getMe } from "../../services/user.service";
import { enqueueSnackbar } from "notistack";

interface GuardProps {
  children: React.ReactNode
}

export const Guard: React.FC<GuardProps> = ({ children } : GuardProps) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const user = useSelector((state: RootState) => state.auth.user);
  let token = localStorage.getItem('authToken');

  if (token && isTokenValid(token)) {
    dispatch(loginSetToken({token: token}));
  } else if (token && !isTokenValid(token)) {
    token = null
    dispatch(logoutState());
  } else {
    dispatch(logoutState());
  }

  if (token !== null && user === null) {
    try{
      getMe().then((result) => {
        if (result) {
          dispatch(loginState({ user: result, isAuthenticated: true, token: token }))
        }
      }).catch(error => {
        enqueueSnackbar("Could not get user data: " + error.toString(), { variant: "error" })
      })
    } catch (e) {
      enqueueSnackbar("Could not get user data: " + e, { variant: "error" })
    }
  }

  if (!excludedRoutes.includes(window.location.pathname) && (!isAuthenticated && token === null)) {
    window.location.href = "/login"
    return null
  }

  return <>{children}</>;
};

export default Guard;
