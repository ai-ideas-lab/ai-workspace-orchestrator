"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAuthService = void 0;
const crypto_1 = require("crypto");
const errors_js_1 = require("../utils/errors.js");
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const SALT_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 50;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000;
function generateId() {
    return `usr_${Date.now().toString(36)}_${(0, crypto_1.randomBytes)(4).toString('hex')}`;
}
function hashPassword(password, salt) {
    return (0, crypto_1.createHash)('sha256').update(`${password}${salt}`).digest('hex');
}
function validatePasswordStrength(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new errors_js_1.ValidationError(`密码长度不能少于 ${MIN_PASSWORD_LENGTH} 位`, 'password');
    }
    if (!/[a-z]/.test(password)) {
        throw new errors_js_1.ValidationError('密码必须包含小写字母', 'password');
    }
    if (!/[A-Z]/.test(password)) {
        throw new errors_js_1.ValidationError('密码必须包含大写字母', 'password');
    }
    if (!/[0-9]/.test(password)) {
        throw new errors_js_1.ValidationError('密码必须包含数字', 'password');
    }
    if (!/[!@#$%^&*]/.test(password)) {
        throw new errors_js_1.ValidationError('密码必须包含特殊字符 (!@#$%^&*)', 'password');
    }
}
function validateUsername(username) {
    if (username.length < 3 || username.length > MAX_USERNAME_LENGTH) {
        throw new errors_js_1.ValidationError(`用户名长度必须在 3-${MAX_USERNAME_LENGTH} 个字符之间`, 'username');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new errors_js_1.ValidationError('用户名只能包含字母、数字和下划线', 'username');
    }
    if (/^\d/.test(username)) {
        throw new errors_js_1.ValidationError('用户名不能以数字开头', 'username');
    }
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
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
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
        this.loginAttempts = new Map();
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
    async register(params) {
        try {
            const { username, password, role = 'viewer' } = params;
            validateUsername(username);
            validatePasswordStrength(password);
            if (this.usernameIndex.has(username)) {
                throw new errors_js_1.ConflictError(`用户名 "${username}" 已存在`);
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
            console.log(`用户注册成功: ${username}`);
            return {
                id: user.id,
                username: user.username,
                role: user.role,
                active: user.active,
                createdAt: user.createdAt,
            };
        }
        catch (error) {
            if (error instanceof errors_js_1.AppError) {
                throw error;
            }
            throw new errors_js_1.SystemError(`用户注册失败: ${error instanceof Error ? error.message : String(error)}`, 'UserAuthService');
        }
    }
    async login(params) {
        try {
            const { username, password } = params;
            if (!username || !password) {
                throw new errors_js_1.ValidationError('用户名和密码不能为空', 'credentials');
            }
            const loginAttempt = this.loginAttempts.get(username);
            if (loginAttempt?.lockedUntil && Date.now() < loginAttempt.lockedUntil) {
                const remainingTime = Math.ceil((loginAttempt.lockedUntil - Date.now()) / 1000);
                throw new errors_js_1.AuthenticationError(`账号已被锁定，请在 ${remainingTime} 秒后重试`, { lockedUntil: loginAttempt.lockedUntil });
            }
            const userId = this.usernameIndex.get(username);
            if (!userId) {
                throw new errors_js_1.AuthenticationError('用户名或密码错误', { username });
            }
            const user = this.users.get(userId);
            if (!user.active) {
                throw new errors_js_1.AuthenticationError('账号已被禁用', { userId, username });
            }
            const inputHash = hashPassword(password, user.salt);
            if (inputHash !== user.passwordHash) {
                this.recordFailedLogin(username);
                throw new errors_js_1.AuthenticationError('用户名或密码错误', { username });
            }
            this.clearFailedLogin(username);
            user.lastLoginAt = new Date();
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                sub: user.id,
                username: user.username,
                role: user.role,
                iat: now,
                exp: now + TOKEN_EXPIRY_SECONDS,
                type: 'access',
            };
            const accessToken = encodeJWT(payload, this.secret);
            const refreshToken = encodeJWT({
                ...payload,
                exp: now + REFRESH_TOKEN_EXPIRY_SECONDS,
                type: 'refresh',
            }, this.secret);
            console.log(`用户登录成功: ${username}`);
            return {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    active: user.active,
                },
            };
        }
        catch (error) {
            if (error instanceof errors_js_1.AppError) {
                throw error;
            }
            throw new errors_js_1.SystemError(`用户登录失败: ${error instanceof Error ? error.message : String(error)}`, 'UserAuthService');
        }
    }
    verifyToken(token) {
        return decodeJWT(token, this.secret);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.verifyToken(refreshToken);
            if (!payload) {
                throw new errors_js_1.AuthenticationError('刷新令牌无效');
            }
            if (payload.type !== 'refresh') {
                throw new errors_js_1.AuthenticationError('令牌类型错误');
            }
            if (payload.exp < Math.floor(Date.now() / 1000)) {
                throw new errors_js_1.AuthenticationError('刷新令牌已过期');
            }
            const now = Math.floor(Date.now() / 1000);
            const newPayload = {
                ...payload,
                exp: now + TOKEN_EXPIRY_SECONDS,
                type: 'access',
            };
            const newAccessToken = encodeJWT(newPayload, this.secret);
            return { accessToken: newAccessToken };
        }
        catch (error) {
            if (error instanceof errors_js_1.AppError) {
                throw error;
            }
            throw new errors_js_1.AuthenticationError('刷新令牌失败');
        }
    }
    async refreshRole(userId, newRole, currentUserId, currentRole) {
        try {
            const validRoles = ['admin', 'editor', 'viewer'];
            if (!validRoles.includes(newRole)) {
                throw new errors_js_1.ValidationError(`无效的角色: ${newRole}`, 'role');
            }
            if (currentRole !== 'admin') {
                throw new errors_js_1.AuthorizationError('只有管理员可以修改用户角色');
            }
            const user = this.users.get(userId);
            if (!user) {
                throw new Error(`用户 "${userId}" 不存在`);
            }
            user.role = newRole;
            console.log(`用户角色更新: ${userId} -> ${newRole}`);
            return { id: user.id, username: user.username, role: user.role };
        }
        catch (error) {
            if (error instanceof errors_js_1.AppError) {
                throw error;
            }
            throw new errors_js_1.SystemError(`更新用户角色失败: ${error instanceof Error ? error.message : String(error)}`, 'UserAuthService');
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error(`用户 "${userId}" 不存在`);
            }
            const currentHash = hashPassword(currentPassword, user.salt);
            if (currentHash !== user.passwordHash) {
                throw new errors_js_1.AuthenticationError('当前密码错误');
            }
            validatePasswordStrength(newPassword);
            const newSalt = (0, crypto_1.randomBytes)(SALT_LENGTH).toString('hex');
            const newPasswordHash = hashPassword(newPassword, newSalt);
            user.salt = newSalt;
            user.passwordHash = newPasswordHash;
            console.log(`用户密码修改成功: ${userId}`);
        }
        catch (error) {
            if (error instanceof errors_js_1.AppError) {
                throw error;
            }
            throw new errors_js_1.SystemError(`修改密码失败: ${error instanceof Error ? error.message : String(error)}`, 'UserAuthService');
        }
    }
    recordFailedLogin(username) {
        const attempt = this.loginAttempts.get(username) || { attempts: 0, lockedUntil: null };
        attempt.attempts++;
        if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
            attempt.lockedUntil = Date.now() + LOGIN_LOCKOUT_DURATION;
            console.log(`账号 ${username} 因多次登录失败被锁定`);
        }
        this.loginAttempts.set(username, attempt);
    }
    clearFailedLogin(username) {
        this.loginAttempts.delete(username);
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
    getLoginStatus(username) {
        const attempt = this.loginAttempts.get(username) || { attempts: 0, lockedUntil: null };
        return {
            attempts: attempt.attempts,
            lockedUntil: attempt.lockedUntil,
            isLocked: attempt.lockedUntil ? Date.now() < attempt.lockedUntil : false,
        };
    }
}
exports.UserAuthService = UserAuthService;
//# sourceMappingURL=user-auth-enhanced.js.map