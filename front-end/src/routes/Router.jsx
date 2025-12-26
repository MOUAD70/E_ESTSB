import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/global/Home";
import Contact from "../pages/global/Contact";
import About from "../pages/global/About";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import NotFound from "../pages/errors/NotFound";
import {
  REGISTER_ROUTE,
  LOGIN_ROUTE,
  CONTACT_ROUTE,
  ABOUT_ROUTE,
  UNAUTHORIZED_ROUTE,
  ADMIN_DASHBOARD_ROUTE,
  CANDIDAT_APLY_ROUTE,
  JURY_DASHBOARD_ROUTE,
} from "./Routes";
import GlobalLayout from "../layouts/GlobalLayout";
import Unauthorized from "../pages/errors/Unauthorized";
import { AdminDashboard } from "../pages/common/admin/AdminDashboard";
import { CandidateDashboard } from "../pages/common/candidate/CandidateDashboard";
import { JuryDashboard } from "../pages/common/jury/JuryDashboard";

export const router = createBrowserRouter([
  {
    element: <GlobalLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: REGISTER_ROUTE,
        element: <Register />,
      },
      {
        path: LOGIN_ROUTE,
        element: <Login />,
      },
      {
        path: ABOUT_ROUTE,
        element: <About />,
      },
      {
        path: CONTACT_ROUTE,
        element: <Contact />,
      },
    ],
  },
  {
    path: ADMIN_DASHBOARD_ROUTE,
    element: <AdminDashboard />,
  },
  {
    path: JURY_DASHBOARD_ROUTE,
    element: <JuryDashboard />,
  },
  {
    path: CANDIDAT_APLY_ROUTE,
    element: <CandidateDashboard />,
  },
  {
    path: UNAUTHORIZED_ROUTE,
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
