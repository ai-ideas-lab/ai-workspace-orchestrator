import { z } from 'zod';
export const registerSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const validateRequest = (schema, data) => {
    return schema.parse(data);
};
export const formatValidationError = (error) => {
    return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
};
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const isValidUsername = (username) => {
    return username.length >= 3 && username.length <= 20 &&
        /^[a-zA-Z0-9_]+$/.test(username);
};
export const isValidPassword = (password) => {
    return password.length >= 6;
};
//# sourceMappingURL=validationUtils.js.map