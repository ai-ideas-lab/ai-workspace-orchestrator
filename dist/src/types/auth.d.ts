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
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string;
        createdAt: Date;
    };
    token: string;
    expiresAt: Date;
}
export interface UserResponse {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
}
export interface AuthConfig {
    port: number;
    jwtSecret: string;
    jwtExpiry: string;
    bcryptRounds: number;
}
export declare enum AuthError {
    INVALID_CREDENTIALS = "\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF",
    EMAIL_EXISTS = "\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C",
    USERNAME_EXISTS = "\u7528\u6237\u540D\u5DF2\u88AB\u4F7F\u7528",
    INVALID_TOKEN = "token\u65E0\u6548\u6216\u5DF2\u8FC7\u671F",
    MISSING_TOKEN = "\u7F3A\u5C11\u8BA4\u8BC1token",
    USER_NOT_FOUND = "\u7528\u6237\u4E0D\u5B58\u5728",
    SERVER_ERROR = "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
}
export interface HealthResponse {
    status: string;
    timestamp: string;
    service: string;
}
//# sourceMappingURL=auth.d.ts.map