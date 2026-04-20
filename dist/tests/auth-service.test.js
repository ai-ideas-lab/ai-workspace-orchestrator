import { AuthService, JWTService } from '../services/auth-service';
describe('AuthService', () => {
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
    };
    describe('用户注册', () => {
        it('应该成功注册新用户', async () => {
            const result = await AuthService.register(testUser);
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user.username).toBe(testUser.username);
            expect(result.user.email).toBe(testUser.email);
            expect(result.user.role).toBe(testUser.role);
            expect(result.user.id).toBeDefined();
        });
        it('应该拒绝重复用户名', async () => {
            await AuthService.register(testUser);
            await expect(AuthService.register({
                ...testUser,
                email: 'different@example.com',
            })).rejects.toThrow('用户名已存在');
        });
        it('应该拒绝重复邮箱', async () => {
            await AuthService.register(testUser);
            await expect(AuthService.register({
                ...testUser,
                username: 'differentuser',
            })).rejects.toThrow('邮箱已被使用');
        });
        it('应该默认创建普通用户', async () => {
            const result = await AuthService.register({
                username: 'defaultuser',
                email: 'default@example.com',
                password: 'password123',
            });
            expect(result.user.role).toBe('user');
        });
    });
    describe('用户登录', () => {
        beforeEach(async () => {
            await AuthService.register(testUser);
        });
        it('应该成功登录', async () => {
            const result = await AuthService.login({
                username: testUser.username,
                password: testUser.password,
            });
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user.username).toBe(testUser.username);
        });
        it('应该拒绝错误的密码', async () => {
            await expect(AuthService.login({
                username: testUser.username,
                password: 'wrongpassword',
            })).rejects.toThrow('用户名或密码错误');
        });
        it('应该拒绝不存在的用户', async () => {
            await expect(AuthService.login({
                username: 'nonexistent',
                password: 'password123',
            })).rejects.toThrow('用户名或密码错误');
        });
    });
    describe('密码修改', () => {
        let userId;
        beforeEach(async () => {
            const result = await AuthService.register(testUser);
            userId = result.user.id;
        });
        it('应该成功修改密码', async () => {
            await AuthService.changePassword(userId, 'password123', 'newpassword456');
            const loginResult = await AuthService.login({
                username: testUser.username,
                password: 'newpassword456',
            });
            expect(loginResult.user.id).toBe(userId);
        });
        it('应该拒绝错误的当前密码', async () => {
            await expect(AuthService.changePassword(userId, 'wrongpassword', 'newpassword456')).rejects.toThrow('当前密码错误');
        });
        it('应该拒绝过短的新密码', async () => {
            await expect(AuthService.changePassword(userId, 'password123', '123')).rejects.toThrow('密码格式错误');
        });
    });
    describe('JWT令牌', () => {
        it('应该成功生成和验证令牌', () => {
            const mockUser = {
                id: 'test-id',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };
            const token = JWTService.generateToken(mockUser);
            const decoded = JWTService.verifyToken(token);
            expect(decoded.id).toBe(mockUser.id);
            expect(decoded.username).toBe(mockUser.username);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
        });
        it('应该验证失败的令牌', () => {
            const invalidToken = 'invalid.token.here';
            expect(() => {
                JWTService.verifyToken(invalidToken);
            }).toThrow('无效的令牌');
        });
    });
    describe('密码重置', () => {
        beforeEach(async () => {
            await AuthService.register(testUser);
        });
        it('应该成功生成重置令牌', async () => {
            const result = await AuthService.requestPasswordReset(testUser.email);
            expect(result.resetToken).toBeDefined();
            expect(result.expiresAt).toBeInstanceOf(Date);
            expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });
        it('应该拒绝不存在的邮箱', async () => {
            await expect(AuthService.requestPasswordReset('nonexistent@example.com')).rejects.toThrow('邮箱不存在');
        });
        it('应该使用重置令牌重置密码', async () => {
            const resetResult = await AuthService.requestPasswordReset(testUser.email);
            await AuthService.resetPasswordWithToken(resetResult.resetToken, 'newpassword123');
            const loginResult = await AuthService.login({
                username: testUser.username,
                password: 'newpassword123',
            });
            expect(loginResult.user.id).toBeDefined();
        });
        it('应该拒绝无效的重置令牌', async () => {
            await expect(AuthService.resetPasswordWithToken('invalid.token', 'newpassword123')).rejects.toThrow('重置令牌无效或已过期');
        });
    });
    describe('用户信息管理', () => {
        let userId;
        beforeEach(async () => {
            const result = await AuthService.register(testUser);
            userId = result.user.id;
        });
        it('应该成功获取用户信息', async () => {
            const user = await AuthService.getCurrentUser(userId);
            expect(user).toBeDefined();
            expect(user.id).toBe(userId);
            expect(user.username).toBe(testUser.username);
            expect(user.email).toBe(testUser.email);
        });
        it('应该成功更新用户信息', async () => {
            const updatedUser = await AuthService.updateUser(userId, {
                username: 'updateduser',
                email: 'updated@example.com',
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.username).toBe('updateduser');
            expect(updatedUser.email).toBe('updated@example.com');
        });
        it('应该拒绝已被使用的用户名', async () => {
            await AuthService.register({
                username: 'anotheruser',
                email: 'another@example.com',
                password: 'password123',
            });
            await expect(AuthService.updateUser(userId, {
                username: 'anotheruser',
            })).rejects.toThrow('用户名已被使用');
        });
        it('应该成功删除用户', async () => {
            await AuthService.deleteUser(userId);
            const user = await AuthService.getCurrentUser(userId);
            expect(user).toBeNull();
        });
    });
});
//# sourceMappingURL=auth-service.test.js.map