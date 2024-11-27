import { API_URL } from "../constants/url";
import { enqueueSnackbar } from "notistack";

const useLogout = () => {
  const  logout = async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
    })

    if (!res.ok) {
      enqueueSnackbar("An error occurred while logging out", { variant: "error" });
    }
  }

  return { logout }
}

export { useLogout }