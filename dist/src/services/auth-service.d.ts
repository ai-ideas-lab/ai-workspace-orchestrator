import { z } from 'zod';
declare const UserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<["user", "admin"]>>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    role: "admin" | "user";
}, {
    email: string;
    password: string;
    name: string;
    role?: "admin" | "user" | undefined;
}>;
export type UserInput = z.infer<typeof UserSchema>;
export declare class AuthService {
    private databaseService;
    private jwtSecret;
    constructor();
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    generateToken(user: any): string;
    verifyToken(token: string): any;
    register(userData: UserInput): Promise<{
        success: boolean;
        data: {
            user: {
                id: string;
                email: string;
                name: any;
                role: import(".prisma/client").$Enums.UserRole;
            };
            token: string;
        };
        timestamp: string;
    }>;
    login(email: string, password: string): Promise<{
        success: boolean;
        data: {
            user: {
                id: string;
                email: string;
                name: any;
                role: import(".prisma/client").$Enums.UserRole;
            };
            token: string;
        };
        timestamp: string;
    }>;
    getCurrentUser(token: string): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            name: string | null;
            role: import(".prisma/client").$Enums.UserRole;
        };
        timestamp: string;
    }>;
    logout(token: string): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    authMiddleware(req: any, res: any, next: any): any;
    requireRole(role: string): (req: any, res: any, next: any) => any;
}
export declare const authMiddleware: (req: any, res: any, next: any) => void;
export declare const requireRole: (role: string) => (req: any, res: any, next: any) => any;
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth-service.d.ts.map