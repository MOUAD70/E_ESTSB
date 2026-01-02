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
  ADMIN_USERS_ROUTE,
  ADMIN_FINAL_SCORES_ROUTE,
  CANDIDATE_PROGRAMS_ROUTE,
  CANDIDATE_UPLOAD_DOCS_ROUTE,
  CANDIDATE_RESULT_ROUTE,
} from "./Routes";
import GlobalLayout from "../layouts/GlobalLayout";
import Unauthorized from "../pages/errors/Unauthorized";
import EvaluateurDashboard from "../pages/common/evaluateur/EvaluateurDashboard";
import ProtectedRoute from "./protectedRoutes/ProtectedRoute";
import Dashboard from "../pages/common/admin/Dashboard";
import AdminLayout from "../layouts/AdminLayout";
import Users from "../pages/common/admin/Users";
import Results from "../pages/common/admin/Results";
import Apply from "../pages/common/candidate/Apply";
import CandidateLayout from "../layouts/CandidateLayout";
import Programs from "../pages/common/candidate/Programs";
import AddDocuments from "../pages/common/candidate/AddDocuments";
import CResults from "../pages/common/candidate/CResults";

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
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ADMIN_DASHBOARD_ROUTE,
        element: <Dashboard />,
      },
      {
        path: ADMIN_USERS_ROUTE,
        element: <Users />,
      },
      {
        path: ADMIN_FINAL_SCORES_ROUTE,
        element: <Results />,
      },
    ],
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
    element: (
      <ProtectedRoute allowedRoles={["CANDIDAT"]}>
        <CandidateLayout/>
      </ProtectedRoute>
    ),
    children: [
      {
        path: CANDIDAT_APPLY_ROUTE,
        element: <Apply/>
      },
      {
        path: CANDIDATE_PROGRAMS_ROUTE,
        element: <Programs/>
      },
      {
        path: CANDIDATE_UPLOAD_DOCS_ROUTE,
        element: <AddDocuments/>
      },
      {
        path: CANDIDATE_RESULT_ROUTE,
        element: <CResults/>
      }
    ]

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
