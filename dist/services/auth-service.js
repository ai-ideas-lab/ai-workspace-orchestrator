import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EnhancedDatabaseService } from './enhanced-database-service.js';
import { z } from 'zod';
const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['user', 'admin']).optional().default('user')
});
export class AuthService {
    databaseService;
    jwtSecret;
    constructor() {
        this.databaseService = new EnhancedDatabaseService();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    }
    async hashPassword(password) {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }
    async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        };
        return jwt.sign(payload, this.jwtSecret);
    }
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async register(userData) {
        const validatedData = UserSchema.parse(userData);
        const existingUser = await this.databaseService.getPrisma().user.findUnique({
            where: { email: validatedData.email }
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await this.hashPassword(validatedData.password);
        const user = await this.databaseService.createUser({
            ...validatedData,
            password: hashedPassword
        });
        const token = this.generateToken(user);
        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            },
            timestamp: new Date().toISOString()
        };
    }
    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        const user = await this.databaseService.getPrisma().user.findUnique({
            where: { email }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        const token = this.generateToken(user);
        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            },
            timestamp: new Date().toISOString()
        };
    }
    async getCurrentUser(token) {
        try {
            const decoded = this.verifyToken(token);
            const user = await this.databaseService.getPrisma().user.findUnique({
                where: { id: decoded.userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            return {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async logout(token) {
        return {
            success: true,
            message: 'Logged out successfully',
            timestamp: new Date().toISOString()
        };
    }
    authMiddleware(req, res, next) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }
        try {
            const decoded = this.verifyToken(token);
            req.user = decoded;
            next();
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
    }
    requireRole(role) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }
            if (req.user.role !== role) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }
            next();
        };
    }
}
export const authMiddleware = (req, res, next) => {
    const authService = new AuthService();
    authService.authMiddleware(req, res, next);
};
export const requireRole = (role) => {
    const authService = new AuthService();
    return authService.requireRole(role);
};
export const authService = new AuthService();
//# sourceMappingURL=auth-service.js.map