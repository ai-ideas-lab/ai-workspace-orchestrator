import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from '../services/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import OptimizedApp from './OptimizedApp';
const LoginPage = React.lazy(() => import('../pages/Login'));
const AppWrapper = () => {
    return (<AuthProvider>
      <ConfigProvider locale={zhCN} theme={{
            token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
            },
        }}>
        <Router>
          <Routes>
            
            <Route path="/login" element={<Suspense fallback={<div>加载中...</div>}>
                  <LoginPage />
                </Suspense>}/>
            
            
            <Route path="/*" element={<ProtectedRoute>
                  <OptimizedApp />
                </ProtectedRoute>}/>
            
            
            <Route path="/" element={<Navigate to="/login" replace/>}/>
          </Routes>
        </Router>
      </ConfigProvider>
    </AuthProvider>);
};
export default AppWrapper;
//# sourceMappingURL=AppWrapper.js.map