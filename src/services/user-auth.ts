/**
 * UserAuthService - 用户认证服务
 *
 * 为 AI Workspace Orchestrator 提供用户注册、登录认证和 Token 管理功能。
 * 支持密码哈希存储、JWT 令牌签发和基础角色管理。
 *
 * 核心职责:
 *   1. register()     — 用户注册（密码哈希 + 唯一性校验）
 *   2. login()        — 用户登录（密码验证 + JWT 签发）
 *   3. verifyToken()  — 验证 JWT 令牌有效性
 *   4. refreshRole()  — 更新用户角色
 *
 * 使用方式:
 *   const auth = UserAuthService.getInstance();
 *   const user = await auth.register({ username: 'alice', password: 'secret', role: 'admin' });
 *   const token = await auth.login({ username: 'alice', password: 'secret' });
 *   const payload = auth.verifyToken(token.accessToken);
 */

import { createHash, randomBytes } from 'crypto';

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
  user: Pick<User, 'id' | 'username' | 'role' | 'active'>;
}

/** JWT 令牌载荷 */
export interface TokenPayload {
  sub: string;       // user ID
  username: string;
  role: UserRole;
  iat: number;       // issued at
  exp: number;       // expiration
}

// ── 常量 ──────────────────────────────────────────────────

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 小时
const SALT_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 6;

// ── 辅助函数 ──────────────────────────────────────────────

/** 生成唯一 ID */
function generateId(): string {
  return `usr_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
}

/** 密码哈希: SHA-256(password + salt) */
function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}${salt}`).digest('hex');
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
    if (!body) return null;
    const payload: TokenPayload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8')
    );
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
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

  // ── 核心方法 ──────────────────────────────────────────

  /**
   * 用户注册
   *
   * 校验用户名唯一性和密码强度，生成 salt + 哈希存储。
   *
   * @returns 新建的用户记录（不含密码哈希和盐值）
   * @throws 用户名已存在或密码过短
   */
  register(params: RegisterParams): Pick<User, 'id' | 'username' | 'role' | 'active' | 'createdAt'> {
    const { username, password, role = 'viewer' } = params;

    // 唯一性校验
    if (this.usernameIndex.has(username)) {
      throw new Error(`用户名 "${username}" 已存在`);
    }

    // 密码强度校验
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`密码长度不能少于 ${MIN_PASSWORD_LENGTH} 位`);
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

  /**
   * 用户登录
   *
   * 校验密码哈希，签发 JWT 令牌。
   *
   * @returns accessToken + 用户基本信息
   * @throws 用户不存在、密码错误或账号已禁用
   */
  login(params: LoginParams): LoginResult {
    const { username, password } = params;

    const userId = this.usernameIndex.get(username);
    if (!userId) {
      throw new Error('用户名或密码错误');
    }

    const user = this.users.get(userId)!;

    // 账号状态校验
    if (!user.active) {
      throw new Error('账号已被禁用');
    }

    // 密码校验
    const inputHash = hashPassword(password, user.salt);
    if (inputHash !== user.passwordHash) {
      throw new Error('用户名或密码错误');
    }

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

  // ── 辅助方法 ──────────────────────────────────────────

  /**
   * 验证 JWT 令牌
   *
   * @returns 令牌载荷，或 null（无效/过期）
   */
  verifyToken(token: string): TokenPayload | null {
    return decodeJWT(token, this.secret);
  }

  /**
   * 更新用户角色
   *
   * @returns 更新后的用户信息
   * @throws 用户不存在
   */
  refreshRole(userId: string, newRole: UserRole): Pick<User, 'id' | 'username' | 'role'> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`用户 "${userId}" 不存在`);
    }
    user.role = newRole;
    return { id: user.id, username: user.username, role: user.role };
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
}
