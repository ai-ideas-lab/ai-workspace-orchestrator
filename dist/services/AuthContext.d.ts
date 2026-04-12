import React from 'react';
interface User {
    id: number;
    username: string;
    email: string;
}
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}
export declare const useAuth: () => AuthContextType;
interface AuthProviderProps {
    children: React.ReactNode;
}
export declare const AuthProvider: React.FC<AuthProviderProps>;
export {};
//# sourceMappingURL=AuthContext.d.ts.map