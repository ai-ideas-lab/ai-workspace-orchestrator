import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../services/AuthContext';
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (<div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
        <Spin size="large"/>
      </div>);
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    return <>{children}</>;
};
export default ProtectedRoute;
//# sourceMappingURL=ProtectedRoute.js.map