import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { LOGIN_ROUTE, UNAUTHORIZED_ROUTE } from "../Routes";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) return <Navigate replace to={LOGIN_ROUTE} />;

  if (allowedRoles && !allowedRoles.includes((user.role || "").toUpperCase())) {
    return <Navigate replace to={UNAUTHORIZED_ROUTE} />;
  }

  return children;
};

export default ProtectedRoute;
