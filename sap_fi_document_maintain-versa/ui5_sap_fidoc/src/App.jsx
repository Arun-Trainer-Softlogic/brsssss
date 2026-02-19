
import { useRoutes } from "react-router";
import { AuthProvider } from './hooks/auth';
import { RootIndex } from "./components/RootIndex";
import { RequireAuth } from "./components/RequireAuth";
import { LogIn } from "./components/LogIn";
import { RootShellBar } from "./components/RootShellBar";
import { FiPostList } from "./components/FiPostList";
import { FipostAlert } from "./components/FipostAlert";

export const App = () => {
  const routes = useRoutes([
    {
      path: "/",
      element: <RootShellBar />,
      children: [
        {
          index: true,
          element: <RootIndex />
        },
        {
          path: "login",
          element: <LogIn />,
        },
        {
          path: "fiposteddoc",
          element: <RequireAuth><FiPostList /></RequireAuth>,
        },
        {
          path: "fipostAlert",
          element: <RequireAuth><FipostAlert /></RequireAuth>,
        },
        {
          path: "*",
          element: <h1 style={{ color: "red", textAlign: "center" }} >404 : Not Found!</h1>,
        }
      ]
    }
  ])
  return <AuthProvider children={routes} />
}