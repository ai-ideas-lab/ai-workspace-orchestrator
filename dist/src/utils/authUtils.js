import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
export const JWT_EXPIRY = '24h';
export const BCRYPT_ROUNDS = 10;
export const TOKEN_PREFIX = 'Bearer ';
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
};
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
export const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret', { expiresIn: JWT_EXPIRY });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    }
    catch (error) {
        return null;
    }
};
export const findUserByEmail = (users, email) => {
    return Array.from(users.values()).find(user => user.email === email);
};
export const findUserById = (users, userId) => {
    return users.get(userId);
};
export const findUserByUsername = (users, username) => {
    return Array.from(users.values()).find(user => user.username === username);
};
export const findSessionByToken = (sessions, token) => {
    return Array.from(sessions.values()).find(session => session.token === token);
};
export const findActiveSessionByToken = (sessions, token) => {
    const session = findSessionByToken(sessions, token);
    return session && session.isActive && session.expiresAt > new Date() ? session : undefined;
};
export const createSession = (userId, token) => {
    return {
        id: uuidv4(),
        userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
    };
};
export const deactivateSession = (sessions, token) => {
    const session = findSessionByToken(sessions, token);
    if (session) {
        session.isActive = false;
        sessions.set(session.id, session);
        return true;
    }
    return false;
};
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith(TOKEN_PREFIX)) {
        return null;
    }
    return authHeader.substring(TOKEN_PREFIX.length);
};
export const isUserExistsByEmail = (users, email) => {
    return findUserByEmail(users, email) !== undefined;
};
export const isUserExistsByUsername = (users, username) => {
    return findUserByUsername(users, username) !== undefined;
};
//# sourceMappingURL=authUtils.js.map