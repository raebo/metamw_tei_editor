import { createBrowserRouter } from "react-router-dom";
import Login from "./auth/Login";
import HomePage from "./pages/HomePage";

// @ts-ignore
const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/",
        element: <HomePage/>
    }
])

export default router;