import excludedRoutes from "../../constants/excluded-routes";
import { useAuth } from "./AuthContext";

interface GuardProps {
  children: React.ReactNode
}

const checkUser = () : boolean => {
  return true
}

const useGuardAuth = (): { isAuthenticated: boolean } => {
  // const { isAuthenticated } = useAuth();

  const token = localStorage.getItem('authToken');

  if (!token && !checkUser()) {
    return { isAuthenticated: false }
  }

  return { isAuthenticated: true }
}

export const Guard: React.FC<GuardProps> = ({ children } : GuardProps) => {
  // const { isAuthenticated } = useGuardAuth();
  const { isAuthenticated } = useAuth();

  if (!excludedRoutes.includes(window.location.pathname) && !isAuthenticated) {
    window.location.href = "/login"
    return null
  }

  return <>{children}</>;
};


// const Guard = ( { children }: GuardProps) => {
//   const user = useSelector((state: RootState) => state.auth.user);
//
//   const { isAuthenticated } = useAuth();
//
//   let content;
//
//   if (excludedRoutes.includes(window.location.pathname)) {
//     content = children;
//   } else if (user) {
//     content = children;
//   } else {
//     window.location.href = "/login"
//     return null
//   }
//
//   return <>{content}</>;
//
// }

export default Guard;
