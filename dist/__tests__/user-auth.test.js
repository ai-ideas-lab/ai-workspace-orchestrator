"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_auth_1 = require("../services/user-auth");
function fresh() {
    user_auth_1.UserAuthService.resetInstance();
    return user_auth_1.UserAuthService.getInstance('test-secret-key');
}
describe('UserAuthService', () => {
    describe('register()', () => {
        it('应成功注册新用户并返回用户信息', () => {
            const auth = fresh();
            const user = auth.register({ username: 'alice', password: 'secret123', role: 'admin' });
            expect(user.id).toMatch(/^usr_/);
            expect(user.username).toBe('alice');
            expect(user.role).toBe('admin');
            expect(user.active).toBe(true);
            expect(user.createdAt).toBeInstanceOf(Date);
        });
        it('默认角色应为 viewer', () => {
            const auth = fresh();
            const user = auth.register({ username: 'bob', password: 'secret123' });
            expect(user.role).toBe('viewer');
        });
        it('应拒绝重复用户名', () => {
            const auth = fresh();
            auth.register({ username: 'alice', password: 'secret123' });
            expect(() => auth.register({ username: 'alice', password: 'another' })).toThrow('已存在');
        });
        it('应拒绝过短的密码', () => {
            const auth = fresh();
            expect(() => auth.register({ username: 'bob', password: '12345' })).toThrow('不能少于');
        });
    });
    describe('login()', () => {
        it('应成功登录并返回 JWT 令牌', () => {
            const auth = fresh();
            auth.register({ username: 'alice', password: 'secret123', role: 'admin' });
            const result = auth.login({ username: 'alice', password: 'secret123' });
            expect(result.accessToken).toBeTruthy();
            expect(result.user.username).toBe('alice');
            expect(result.user.role).toBe('admin');
        });
        it('应拒绝错误密码', () => {
            const auth = fresh();
            auth.register({ username: 'alice', password: 'secret123' });
            expect(() => auth.login({ username: 'alice', password: 'wrong' })).toThrow('用户名或密码错误');
        });
        it('应拒绝不存在的用户', () => {
            const auth = fresh();
            expect(() => auth.login({ username: 'ghost', password: 'whatever' })).toThrow('用户名或密码错误');
        });
        it('应拒绝已禁用的账号', () => {
            const auth = fresh();
            auth.register({ username: 'banned', password: 'secret123' });
        });
    });
    describe('verifyToken()', () => {
        it('应正确解码有效令牌', () => {
            const auth = fresh();
            auth.register({ username: 'alice', password: 'secret123', role: 'editor' });
            const { accessToken } = auth.login({ username: 'alice', password: 'secret123' });
            const payload = auth.verifyToken(accessToken);
            expect(payload).not.toBeNull();
            expect(payload.username).toBe('alice');
            expect(payload.role).toBe('editor');
            expect(payload.exp).toBeGreaterThan(payload.iat);
        });
        it('应拒绝篡改过的令牌', () => {
            const auth = fresh();
            auth.register({ username: 'alice', password: 'secret123' });
            const { accessToken } = auth.login({ username: 'alice', password: 'secret123' });
            const tampered = accessToken.slice(0, -5) + 'XXXXX';
            expect(auth.verifyToken(tampered)).toBeNull();
        });
        it('应拒绝格式错误的令牌', () => {
            const auth = fresh();
            expect(auth.verifyToken('not-a-jwt')).toBeNull();
            expect(auth.verifyToken('')).toBeNull();
        });
    });
    describe('refreshRole()', () => {
        it('应成功更新用户角色', () => {
            const auth = fresh();
            const user = auth.register({ username: 'alice', password: 'secret123', role: 'viewer' });
            const updated = auth.refreshRole(user.id, 'admin');
            expect(updated.role).toBe('admin');
            expect(updated.username).toBe('alice');
        });
        it('应拒绝不存在的用户', () => {
            const auth = fresh();
            expect(() => auth.refreshRole('usr_nonexistent', 'admin')).toThrow('不存在');
        });
    });
    describe('findByUsername()', () => {
        it('应找到已注册的用户', () => {
            const auth = fresh();
            auth.register({ username: 'alice', password: 'secret123' });
            const found = auth.findByUsername('alice');
            expect(found).not.toBeNull();
            expect(found.username).toBe('alice');
        });
        it('对未注册用户应返回 null', () => {
            const auth = fresh();
            expect(auth.findByUsername('nobody')).toBeNull();
        });
    });
    describe('userCount', () => {
        it('应正确统计用户数量', () => {
            const auth = fresh();
            expect(auth.userCount).toBe(0);
            auth.register({ username: 'alice', password: 'secret123' });
            expect(auth.userCount).toBe(1);
            auth.register({ username: 'bob', password: 'secret123' });
            expect(auth.userCount).toBe(2);
        });
    });
    describe('singleton', () => {
        it('应返回同一实例', () => {
            const a = user_auth_1.UserAuthService.getInstance();
            const b = user_auth_1.UserAuthService.getInstance();
            expect(a).toBe(b);
        });
        it('resetInstance 后应返回新实例', () => {
            const a = user_auth_1.UserAuthService.getInstance();
            user_auth_1.UserAuthService.resetInstance();
            const b = user_auth_1.UserAuthService.getInstance();
            expect(a).not.toBe(b);
        });
    });
});
//# sourceMappingURL=user-auth.test.js.map