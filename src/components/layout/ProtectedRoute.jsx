import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;