import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
}, {
    username: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, data: any) => T;
export declare const formatValidationError: (error: z.ZodError) => string[];
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidUsername: (username: string) => boolean;
export declare const isValidPassword: (password: string) => boolean;
//# sourceMappingURL=validationUtils.d.ts.map