import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import Executions from './pages/Executions';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { authApi } from './utils/api';
import './App.css';
const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        checkAuthStatus();
    }, []);
    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await authApi.getCurrentUser();
                if (response.success) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                }
                else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                }
            }
            catch (error) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    };
    const handleLogin = async (userData, token) => {
        setIsAuthenticated(true);
        setUser(userData);
        localStorage.setItem('authToken', token);
    };
    const handleLogout = async () => {
        try {
            await authApi.logout();
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    };
    if (loading) {
        return (<div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
        <div style={{ color: 'white', fontSize: 18 }}>
          加载中...
        </div>
      </div>);
    }
    return (<Router>
      <div className="App">
        {isAuthenticated ? (<>
            <Navbar user={user} onLogout={handleLogout}/>
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />}/>
                <Route path="/workflows" element={<Workflows />}/>
                <Route path="/executions" element={<Executions />}/>
                <Route path="/settings" element={<Settings />}/>
                <Route path="/profile" element={<Settings />}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
              </Routes>
            </main>
          </>) : (<Routes>
            <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
            <Route path="/register" element={<Register onRegister={handleLogin}/>}/>
            <Route path="/" element={<Navigate to="/login" replace/>}/>
          </Routes>)}
      </div>
    </Router>);
};
export default App;
//# sourceMappingURL=App.js.map