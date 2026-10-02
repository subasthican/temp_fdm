/**
 * Route guard — redirects to login when unauthenticated, and to the
 * user's home when their role isn't allowed for the route.
 */
import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore.js';
import { ROLES, ROUTES } from '../constants';

const ProtectedRoute = ({ allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Send the user to the surface their role belongs to.
    return (
      <Navigate
        to={user.role === ROLES.CASHIER ? ROUTES.POS : ROUTES.DASHBOARD}
        replace
      />
    );
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
