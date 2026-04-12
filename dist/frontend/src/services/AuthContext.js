import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
const AuthContext = createContext(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            }
            catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);
    const login = async (username, password) => {
        try {
            const response = await authApi.login(username, password);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
        }
        catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };
    const register = async (username, email, password) => {
        try {
            const response = await authApi.register(username, email, password);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
        }
        catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };
    const value = {
        user,
        loading,
        login,
        register,
        logout,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
//# sourceMappingURL=AuthContext.js.map