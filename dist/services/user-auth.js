"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAuthService = void 0;
const crypto_1 = require("crypto");
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;
const SALT_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 6;
function generateId() {
    return `usr_${Date.now().toString(36)}_${(0, crypto_1.randomBytes)(4).toString('hex')}`;
}
function hashPassword(password, salt) {
    return (0, crypto_1.createHash)('sha256').update(`${password}${salt}`).digest('hex');
}
function encodeJWT(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = (0, crypto_1.createHash)('sha256')
        .update(`${header}.${body}.${secret}`)
        .digest('base64url');
    return `${header}.${body}.${signature}`;
}
function decodeJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3)
        return null;
    const [header, body, signature] = parts;
    const expectedSig = (0, crypto_1.createHash)('sha256')
        .update(`${header}.${body}.${secret}`)
        .digest('base64url');
    if (signature !== expectedSig)
        return null;
    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
        if (payload.exp < Math.floor(Date.now() / 1000))
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
class UserAuthService {
    constructor(secret) {
        this.users = new Map();
        this.usernameIndex = new Map();
        this.secret = secret || (0, crypto_1.randomBytes)(32).toString('hex');
    }
    static getInstance(secret) {
        if (!UserAuthService.instance) {
            UserAuthService.instance = new UserAuthService(secret);
        }
        return UserAuthService.instance;
    }
    static resetInstance() {
        UserAuthService.instance = undefined;
    }
    register(params) {
        const { username, password, role = 'viewer' } = params;
        if (this.usernameIndex.has(username)) {
            throw new Error(`用户名 "${username}" 已存在`);
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            throw new Error(`密码长度不能少于 ${MIN_PASSWORD_LENGTH} 位`);
        }
        const salt = (0, crypto_1.randomBytes)(SALT_LENGTH).toString('hex');
        const passwordHash = hashPassword(password, salt);
        const user = {
            id: generateId(),
            username,
            passwordHash,
            salt,
            role,
            active: true,
            createdAt: new Date(),
            lastLoginAt: null,
        };
        this.users.set(user.id, user);
        this.usernameIndex.set(username, user.id);
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            active: user.active,
            createdAt: user.createdAt,
        };
    }
    login(params) {
        const { username, password } = params;
        const userId = this.usernameIndex.get(username);
        if (!userId) {
            throw new Error('用户名或密码错误');
        }
        const user = this.users.get(userId);
        if (!user.active) {
            throw new Error('账号已被禁用');
        }
        const inputHash = hashPassword(password, user.salt);
        if (inputHash !== user.passwordHash) {
            throw new Error('用户名或密码错误');
        }
        user.lastLoginAt = new Date();
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
            iat: now,
            exp: now + TOKEN_EXPIRY_SECONDS,
        };
        const accessToken = encodeJWT(payload, this.secret);
        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                active: user.active,
            },
        };
    }
    verifyToken(token) {
        return decodeJWT(token, this.secret);
    }
    refreshRole(userId, newRole) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error(`用户 "${userId}" 不存在`);
        }
        user.role = newRole;
        return { id: user.id, username: user.username, role: user.role };
    }
    findByUsername(username) {
        const userId = this.usernameIndex.get(username);
        if (!userId)
            return null;
        const user = this.users.get(userId);
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            active: user.active,
            createdAt: user.createdAt,
        };
    }
    get userCount() {
        return this.users.size;
    }
}
exports.UserAuthService = UserAuthService;
//# sourceMappingURL=user-auth.js.map