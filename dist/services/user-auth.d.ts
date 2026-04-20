export type UserRole = 'admin' | 'editor' | 'viewer';
export interface User {
    id: string;
    username: string;
    passwordHash: string;
    salt: string;
    role: UserRole;
    active: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
}
export interface RegisterParams {
    username: string;
    password: string;
    role?: UserRole;
}
export interface LoginParams {
    username: string;
    password: string;
}
export interface LoginResult {
    accessToken: string;
    user: Pick<User, 'id' | 'username' | 'role' | 'active'>;
}
export interface TokenPayload {
    sub: string;
    username: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export declare class UserAuthService {
    private static instance;
    private users;
    private usernameIndex;
    private secret;
    private constructor();
    static getInstance(secret?: string): UserAuthService;
    static resetInstance(): void;
    register(params: RegisterParams): Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'>;
    login(params: LoginParams): LoginResult;
    verifyToken(token: string): TokenPayload | null;
    refreshRole(userId: string, newRole: UserRole): Pick<User, 'id' | 'username' | 'role'>;
    findByUsername(username: string): Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'> | null;
    get userCount(): number;
}
//# sourceMappingURL=user-auth.d.ts.map