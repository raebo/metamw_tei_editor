import { useLocation } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";

const AutoAnnoList= () => {
  const location = useLocation()
  const comingFrom = location.state?.from?.pathname || "/";
  const {login, error} = useLogin();


  return (
    <>
      <h1>AutoAnnoList</h1>
    </>
  )
}

export default AutoAnnoList
