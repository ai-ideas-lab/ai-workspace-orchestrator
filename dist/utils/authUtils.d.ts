export declare const JWT_EXPIRY = "24h";
export declare const BCRYPT_ROUNDS = 10;
export declare const TOKEN_PREFIX = "Bearer ";
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    isActive: boolean;
}
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateToken: (userId: string) => string;
export declare const verifyToken: (token: string) => {
    userId: string;
} | null;
export declare const findUserByEmail: (users: Map<string, User>, email: string) => User | undefined;
export declare const findUserById: (users: Map<string, User>, userId: string) => User | undefined;
export declare const findUserByUsername: (users: Map<string, User>, username: string) => User | undefined;
export declare const findSessionByToken: (sessions: Map<string, Session>, token: string) => Session | undefined;
export declare const findActiveSessionByToken: (sessions: Map<string, Session>, token: string) => Session | undefined;
export declare const createSession: (userId: string, token: string) => Session;
export declare const deactivateSession: (sessions: Map<string, Session>, token: string) => boolean;
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string | null;
export declare const isUserExistsByEmail: (users: Map<string, User>, email: string) => boolean;
export declare const isUserExistsByUsername: (users: Map<string, User>, username: string) => boolean;
//# sourceMappingURL=authUtils.d.ts.map