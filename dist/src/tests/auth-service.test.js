import { AuthService } from '../services/auth-service';
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new AuthService();
    });
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'testuser',
        role: 'user',
    };
    describe('用户注册', () => {
        it('应该成功注册新用户', async () => {
            const result = await authService.register(testUser);
            expect(result.success).toBe(true);
            expect(result.data.user).toBeDefined();
            expect(result.data.token).toBeDefined();
            expect(result.data.user.email).toBe(testUser.email);
            expect(result.data.user.role).toBe(testUser.role);
            expect(result.data.user.id).toBeDefined();
        });
        it('应该拒绝重复邮箱', async () => {
            await authService.register(testUser);
            await expect(authService.register({
                ...testUser,
                name: 'differentuser',
            })).rejects.toThrow('User already exists');
        });
        it('应该默认创建普通用户', async () => {
            const result = await authService.register({
                email: 'default@example.com',
                password: 'password123',
                name: 'defaultuser',
            });
            expect(result.data.user.role).toBe('user');
        });
    });
    describe('用户登录', () => {
        beforeEach(async () => {
            await authService.register(testUser);
        });
        it('应该成功登录', async () => {
            const result = await authService.login(testUser.email, testUser.password);
            expect(result.success).toBe(true);
            expect(result.data.user).toBeDefined();
            expect(result.data.token).toBeDefined();
            expect(result.data.user.email).toBe(testUser.email);
        });
        it('应该拒绝错误的密码', async () => {
            await expect(authService.login(testUser.email, 'wrongpassword')).rejects.toThrow('Invalid password');
        });
        it('应该拒绝不存在的用户', async () => {
            await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow('User not found');
        });
    });
    describe('JWT令牌', () => {
        it('应该成功生成和验证令牌', () => {
            const mockUser = {
                id: 'test-id',
                email: 'test@example.com',
                name: 'testuser',
                role: 'user',
            };
            const token = authService.generateToken(mockUser);
            const decoded = authService.verifyToken(token);
            expect(decoded.userId).toBe(mockUser.id);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
        });
        it('应该验证失败的令牌', () => {
            const invalidToken = 'invalid.token.here';
            expect(() => {
                authService.verifyToken(invalidToken);
            }).toThrow('Invalid token');
        });
    });
    describe('当前用户', () => {
        let token;
        beforeEach(async () => {
            const result = await authService.register(testUser);
            token = result.data.token;
        });
        it('应该成功获取当前用户信息', async () => {
            const result = await authService.getCurrentUser(token);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.email).toBe(testUser.email);
            expect(result.data.id).toBeDefined();
        });
        it('应该拒绝无效的令牌', async () => {
            await expect(authService.getCurrentUser('invalid.token')).rejects.toThrow('Invalid token');
        });
    });
    describe('密码操作', () => {
        it('应该成功哈希和比较密码', async () => {
            const password = 'testpassword123';
            const hashed = await authService.hashPassword(password);
            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(password);
            const isValid = await authService.comparePassword(password, hashed);
            expect(isValid).toBe(true);
            const isInvalid = await authService.comparePassword('wrongpassword', hashed);
            expect(isInvalid).toBe(false);
        });
    });
    describe('登出', () => {
        let token;
        beforeEach(async () => {
            const result = await authService.register(testUser);
            token = result.data.token;
        });
        it('应该成功登出', async () => {
            const result = await authService.logout(token);
            expect(result.success).toBe(true);
            expect(result.message).toBe('Logged out successfully');
        });
    });
});
//# sourceMappingURL=auth-service.test.js.map