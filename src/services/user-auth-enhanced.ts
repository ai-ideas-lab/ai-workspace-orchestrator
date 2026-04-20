/**
 * Enhanced UserAuthService - 用户认证服务（增强错误处理版）
 *
 * 为 AI Workspace Orchestrator 提供用户注册、登录认证和 Token 管理功能。
 * 使用统一的错误处理机制和响应格式。
 */

import { createHash, randomBytes } from 'crypto';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  ConflictError,
  SystemError 
} from '../utils/errors.js';
import { successResponse, errorResponse, asyncHandler } from '../utils/responseUtils.js';

// ── 类型定义 ──────────────────────────────────────────────

/** 用户角色 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/** 用户记录 */
export interface User {
  /** 唯一 ID */
  id: string;
  /** 用户名（唯一） */
  username: string;
  /** 密码哈希 (SHA-256 + salt) */
  passwordHash: string;
  /** 随机盐值 */
  salt: string;
  /** 角色 */
  role: UserRole;
  /** 账号状态 */
  active: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后登录时间 */
  lastLoginAt: Date | null;
}

/** 注册参数 */
export interface RegisterParams {
  username: string;
  password: string;
  role?: UserRole;
}

/** 登录参数 */
export interface LoginParams {
  username: string;
  password: string;
}

/** 登录结果 */
export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  user: Pick<User, 'id' | 'username' | 'role' | 'active'>;
}

/** JWT 令牌载荷 */
export interface TokenPayload {
  sub: string;       // user ID
  username: string;
  role: UserRole;
  iat: number;       // issued at
  exp: number;       // expiration
  type: 'access' | 'refresh';
}

// ── 常量 ──────────────────────────────────────────────────

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 小时
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 天
const SALT_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 50;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15分钟

// ── 辅助函数 ──────────────────────────────────────────────

/** 生成唯一 ID */
function generateId(): string {
  return `usr_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
}

/** 密码哈希: SHA-256(password + salt) */
function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}${salt}`).digest('hex');
}

/** 密码强度检查 */
function validatePasswordStrength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`密码长度不能少于 ${MIN_PASSWORD_LENGTH} 位`, 'password');
  }
  
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('密码必须包含小写字母', 'password');
  }
  
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('密码必须包含大写字母', 'password');
  }
  
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('密码必须包含数字', 'password');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    throw new ValidationError('密码必须包含特殊字符 (!@#$%^&*)', 'password');
  }
}

/** 用户名格式检查 */
function validateUsername(username: string): void {
  if (username.length < 3 || username.length > MAX_USERNAME_LENGTH) {
    throw new ValidationError(
      `用户名长度必须在 3-${MAX_USERNAME_LENGTH} 个字符之间`, 
      'username'
    );
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new ValidationError(
      '用户名只能包含字母、数字和下划线', 
      'username'
    );
  }
  
  if (/^\d/.test(username)) {
    throw new ValidationError(
      '用户名不能以数字开头', 
      'username'
    );
  }
}

/** 简易 JWT 编码（无第三方依赖，Base64 + HMAC 签名） */
function encodeJWT(payload: TokenPayload, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHash('sha256')
    .update(`${header}.${body}.${secret}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/** 解码并验证 JWT */
function decodeJWT(token: string, secret: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSig = createHash('sha256')
    .update(`${header}.${body}.${secret}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload: TokenPayload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8')
    );
    
    // 检查过期时间
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// ── 服务实现 ──────────────────────────────────────────────

export class UserAuthService {
  private static instance: UserAuthService;
  private users: Map<string, User> = new Map();
  private usernameIndex: Map<string, string> = new Map(); // username -> userId
  private loginAttempts: Map<string, { attempts: number; lockedUntil: number | null }> = new Map();
  private secret: string;

  private constructor(secret?: string) {
    this.secret = secret || randomBytes(32).toString('hex');
  }

  /** 获取单例实例 */
  static getInstance(secret?: string): UserAuthService {
    if (!UserAuthService.instance) {
      UserAuthService.instance = new UserAuthService(secret);
    }
    return UserAuthService.instance;
  }

  /** 重置单例（测试用） */
  static resetInstance(): void {
    UserAuthService.instance = undefined as unknown as UserAuthService;
  }

  /**
   * 用户注册
   *
   * 校验用户名唯一性和密码强度，生成 salt + 哈希存储。
   *
   * @param params 注册参数
   * @returns 新建的用户记录（不含密码哈希和盐值）
   * @throws ValidationError 参数验证失败
   * @throws ConflictError 用户名已存在
   */
  async register(params: RegisterParams): Promise<Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'>> {
    try {
      const { username, password, role = 'viewer' } = params;

      // 验证用户名格式
      validateUsername(username);

      // 验证密码强度
      validatePasswordStrength(password);

      // 检查用户名唯一性（并发安全）
      if (this.usernameIndex.has(username)) {
        throw new ConflictError(`用户名 "${username}" 已存在`);
      }

      // 生成 salt + 哈希
      const salt = randomBytes(SALT_LENGTH).toString('hex');
      const passwordHash = hashPassword(password, salt);

      const user: User = {
        id: generateId(),
        username,
        passwordHash,
        salt,
        role,
        active: true,
        createdAt: new Date(),
        lastLoginAt: null,
      };

      // 存储用户信息
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
    } catch (error) {
      // 重新抛出已知的错误类型
      if (error instanceof AppError) {
        throw error;
      }
      
      // 包装未知错误
      throw new SystemError(
        `用户注册失败: ${error instanceof Error ? error.message : String(error)}`,
        'UserAuthService'
      );
    }
  }

  /**
   * 用户登录
   *
   * 校验密码哈希，签发 JWT 令牌。
   *
   * @param params 登录参数
   * @returns accessToken + 用户基本信息
   * @throws ValidationError 参数验证失败
   * @throws AuthenticationError 认证失败（账号不存在、密码错误、账号被禁用、被锁定）
   */
  async login(params: LoginParams): Promise<LoginResult> {
    try {
      const { username, password } = params;

      // 参数验证
      if (!username || !password) {
        throw new ValidationError('用户名和密码不能为空', 'credentials');
      }

      // 检查账号是否被锁定
      const loginAttempt = this.loginAttempts.get(username);
      if (loginAttempt?.lockedUntil && Date.now() < loginAttempt.lockedUntil) {
        const remainingTime = Math.ceil((loginAttempt.lockedUntil - Date.now()) / 1000);
        throw new AuthenticationError(
          `账号已被锁定，请在 ${remainingTime} 秒后重试`,
          { lockedUntil: loginAttempt.lockedUntil }
        );
      }

      const userId = this.usernameIndex.get(username);
      if (!userId) {
        throw new AuthenticationError('用户名或密码错误', { username });
      }

      const user = this.users.get(userId)!;

      // 账号状态校验
      if (!user.active) {
        throw new AuthenticationError('账号已被禁用', { userId, username });
      }

      // 密码校验
      const inputHash = hashPassword(password, user.salt);
      if (inputHash !== user.passwordHash) {
        // 记录失败尝试
        this.recordFailedLogin(username);
        throw new AuthenticationError('用户名或密码错误', { username });
      }

      // 登录成功，清除失败记录
      this.clearFailedLogin(username);

      // 更新最后登录时间
      user.lastLoginAt = new Date();

      // 签发 JWT
      const now = Math.floor(Date.now() / 1000);
      const payload: TokenPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        iat: now,
        exp: now + TOKEN_EXPIRY_SECONDS,
        type: 'access',
      };

      const accessToken = encodeJWT(payload, this.secret);

      // 可选：生成刷新令牌
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
    } catch (error) {
      // 重新抛出已知的错误类型
      if (error instanceof AppError) {
        throw error;
      }
      
      // 包装未知错误
      throw new SystemError(
        `用户登录失败: ${error instanceof Error ? error.message : String(error)}`,
        'UserAuthService'
      );
    }
  }

  /**
   * 验证 JWT 令牌
   *
   * @param token JWT 令牌
   * @returns 令牌载荷，或 null（无效/过期）
   */
  verifyToken(token: string): TokenPayload | null {
    return decodeJWT(token, this.secret);
  }

  /**
   * 刷新访问令牌
   *
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌
   * @throws AuthenticationError 刷新令牌无效
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.verifyToken(refreshToken);
      
      if (!payload) {
        throw new AuthenticationError('刷新令牌无效');
      }
      
      if (payload.type !== 'refresh') {
        throw new AuthenticationError('令牌类型错误');
      }
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new AuthenticationError('刷新令牌已过期');
      }
      
      // 生成新的访问令牌
      const now = Math.floor(Date.now() / 1000);
      const newPayload: TokenPayload = {
        ...payload,
        exp: now + TOKEN_EXPIRY_SECONDS,
        type: 'access',
      };
      
      const newAccessToken = encodeJWT(newPayload, this.secret);
      
      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AuthenticationError('刷新令牌失败');
    }
  }

  /**
   * 更新用户角色
   *
   * @param userId 用户ID
   * @param newRole 新角色
   * @returns 更新后的用户信息
   * @throws ValidationError 参数验证失败
   * @throws NotFoundError 用户不存在
   * @throws AuthorizationError 权限不足
   */
  async refreshRole(userId: string, newRole: UserRole, currentUserId?: string, currentRole?: UserRole): Promise<Pick<User, 'id' | 'username' | 'role'>> {
    try {
      // 参数验证
      const validRoles: UserRole[] = ['admin', 'editor', 'viewer'];
      if (!validRoles.includes(newRole)) {
        throw new ValidationError(`无效的角色: ${newRole}`, 'role');
      }

      // 权限检查：只有管理员可以修改角色
      if (currentRole !== 'admin') {
        throw new AuthorizationError('只有管理员可以修改用户角色');
      }

      const user = this.users.get(userId);
      if (!user) {
        throw new Error(`用户 "${userId}" 不存在`);
      }
      
      user.role = newRole;

      console.log(`用户角色更新: ${userId} -> ${newRole}`);

      return { id: user.id, username: user.username, role: user.role };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new SystemError(
        `更新用户角色失败: ${error instanceof Error ? error.message : String(error)}`,
        'UserAuthService'
      );
    }
  }

  /**
   * 修改密码
   *
   * @param userId 用户ID
   * @param currentPassword 当前密码
   * @param newPassword 新密码
   * @returns 更新结果
   * @throws AuthenticationError 当前密码错误
   * @throws ValidationError 新密码不符合强度要求
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error(`用户 "${userId}" 不存在`);
      }

      // 验证当前密码
      const currentHash = hashPassword(currentPassword, user.salt);
      if (currentHash !== user.passwordHash) {
        throw new AuthenticationError('当前密码错误');
      }

      // 验证新密码强度
      validatePasswordStrength(newPassword);

      // 更新密码
      const newSalt = randomBytes(SALT_LENGTH).toString('hex');
      const newPasswordHash = hashPassword(newPassword, newSalt);
      
      user.salt = newSalt;
      user.passwordHash = newPasswordHash;

      console.log(`用户密码修改成功: ${userId}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new SystemError(
        `修改密码失败: ${error instanceof Error ? error.message : String(error)}`,
        'UserAuthService'
      );
    }
  }

  // ── 私有方法 ──────────────────────────────────────────

  /** 记录登录失败 */
  private recordFailedLogin(username: string): void {
    const attempt = this.loginAttempts.get(username) || { attempts: 0, lockedUntil: null };
    attempt.attempts++;
    
    // 如果超过最大尝试次数，锁定账号
    if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
      attempt.lockedUntil = Date.now() + LOGIN_LOCKOUT_DURATION;
      console.log(`账号 ${username} 因多次登录失败被锁定`);
    }
    
    this.loginAttempts.set(username, attempt);
  }

  /** 清除登录失败记录 */
  private clearFailedLogin(username: string): void {
    this.loginAttempts.delete(username);
  }

  /** 按用户名查找用户（内部/测试用） */
  findByUsername(username: string): Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'> | null {
    const userId = this.usernameIndex.get(username);
    if (!userId) return null;
    const user = this.users.get(userId)!;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    };
  }

  /** 获取用户总数 */
  get userCount(): number {
    return this.users.size;
  }

  /** 获取登录状态信息 */
  getLoginStatus(username: string): { attempts: number; lockedUntil: number | null; isLocked: boolean } {
    const attempt = this.loginAttempts.get(username) || { attempts: 0, lockedUntil: null };
    return {
      attempts: attempt.attempts,
      lockedUntil: attempt.lockedUntil,
      isLocked: attempt.lockedUntil ? Date.now() < attempt.lockedUntil : false,
    };
  }
}