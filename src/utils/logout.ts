import router from "../components/Routes.delete";
export const onLogout = async () => {
  try {
    // authenticatedVar.set(false);
    // useReactiveVar(authenticatedVar)
    router.navigate("/login");
    // client.resetStore();
  } catch (error) {
    console.error("Error during logout: " + error);
  }
};