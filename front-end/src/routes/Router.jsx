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
  CANDIDAT_APPLY_ROUTE,
  EVALUATEUR_DASHBOARD_ROUTE,
} from "./Routes";
import GlobalLayout from "../layouts/GlobalLayout";
import Unauthorized from "../pages/errors/Unauthorized";
import CandidateApply from "../pages/common/candidate/CandidateApply";
import EvaluateurDashboard from "../pages/common/evaluateur/EvaluateurDashboard";
import ProtectedRoute from "./protectedRoutes/ProtectedRoute";
import Dashboard from "../pages/common/admin/Dashboard";

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
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: EVALUATEUR_DASHBOARD_ROUTE,
    element: (
      <ProtectedRoute allowedRoles={["EVALUATEUR"]}>
        <EvaluateurDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: CANDIDAT_APPLY_ROUTE,
    element: (
      <ProtectedRoute allowedRoles={["CANDIDAT"]}>
        <CandidateApply />
      </ProtectedRoute>
    ),
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
