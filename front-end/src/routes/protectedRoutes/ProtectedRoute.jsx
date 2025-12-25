import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { LOGIN_ROUTE, UNAUTHORIZED_ROUTE } from "../Routes";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate replace to={LOGIN_ROUTE} />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace to={UNAUTHORIZED_ROUTE} />;
  }

  return children;
};

export default ProtectedRoute;
