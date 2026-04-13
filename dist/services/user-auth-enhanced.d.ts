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
    refreshToken?: string;
    user: Pick<User, 'id' | 'username' | 'role' | 'active'>;
}
export interface TokenPayload {
    sub: string;
    username: string;
    role: UserRole;
    iat: number;
    exp: number;
    type: 'access' | 'refresh';
}
export declare class UserAuthService {
    private static instance;
    private users;
    private usernameIndex;
    private loginAttempts;
    private secret;
    private constructor();
    static getInstance(secret?: string): UserAuthService;
    static resetInstance(): void;
    register(params: RegisterParams): Promise<Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'>>;
    login(params: LoginParams): Promise<LoginResult>;
    verifyToken(token: string): TokenPayload | null;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    refreshRole(userId: string, newRole: UserRole, currentUserId?: string, currentRole?: UserRole): Promise<Pick<User, 'id' | 'username' | 'role'>>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    private recordFailedLogin;
    private clearFailedLogin;
    findByUsername(username: string): Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'> | null;
    get userCount(): number;
    getLoginStatus(username: string): {
        attempts: number;
        lockedUntil: number | null;
        isLocked: boolean;
    };
}
//# sourceMappingURL=user-auth-enhanced.d.ts.map