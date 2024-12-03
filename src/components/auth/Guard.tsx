import excludedRoutes from "../../constants/excluded-routes";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

interface GuardProps {
  children: JSX.Element;
}

const Guard = ( { children }: GuardProps) => {
  const user = useSelector((state: RootState) => state.user.user);

  let content;

  if (excludedRoutes.includes(window.location.pathname)) {
    content = children;
  } else if (user) {
    content = children;
  } else {
    window.location.href = "/login"
    return null
  }

  return <>{content}</>;

}

export default Guard;