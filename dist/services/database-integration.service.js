"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseIntegrationService = exports.DatabaseIntegrationService = void 0;
const postgres_database_service_1 = require("../services/postgres-database-service");
const database_service_1 = require("../services/database-service");
const logger_1 = require("../utils/logger");
class DatabaseIntegrationService {
    constructor() {
        this.isInitialized = false;
        this.postgresDb = postgres_database_service_1.PostgresDatabaseService.getInstance();
        this.memoryDb = new database_service_1.DatabaseService();
    }
    async initializePostgreSQLIntegration() {
        if (this.isInitialized)
            return;
        try {
            logger_1.logger.info('🔄 开始PostgreSQL数据库集成...');
            await this.postgresDb.initialize();
            await this.migrateDataToPostgreSQL();
            await this.replaceMemoryDatabaseWithPostgreSQL();
            await this.verifyIntegration();
            this.isInitialized = true;
            logger_1.logger.info('✅ PostgreSQL数据库集成完成');
        }
        catch (error) {
            logger_1.logger.error('❌ PostgreSQL数据库集成失败:', error);
            throw new Error(`PostgreSQL集成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    async migrateDataToPostgreSQL() {
        logger_1.logger.info('📦 开始数据迁移到PostgreSQL...');
        try {
            const users = this.memoryDb.users;
            const posts = this.memoryDb.posts;
            for (const user of users) {
                await this.postgresDb.createUser({
                    username: user.name,
                    email: user.email,
                    password_hash: 'migrated_hash',
                    role: 'user'
                });
            }
            logger_1.logger.info(`✅ 迁移了 ${users.length} 个用户到PostgreSQL`);
        }
        catch (error) {
            logger_1.logger.error('❌ 数据迁移失败:', error);
            throw error;
        }
    }
    async replaceMemoryDatabaseWithPostgreSQL() {
        logger_1.logger.info('🔄 替换内存数据库服务为PostgreSQL服务...');
        try {
            const memoryData = {
                users: this.memoryDb.users,
                posts: this.memoryDb.posts,
            };
            const postgresDataMapper = {
                users: memoryData.users.map(user => ({
                    id: user.id,
                    username: user.name,
                    email: user.email,
                    password_hash: 'migrated_hash',
                    role: 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })),
                posts: memoryData.posts.map(post => ({
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    author_id: post.authorId,
                    created_at: post.createdAt.toISOString(),
                    updated_at: new Date().toISOString(),
                }))
            };
            for (const userData of postgresDataMapper.users) {
                await this.postgresDb.createUser(userData);
            }
            logger_1.logger.info('✅ 成功替换数据库服务为PostgreSQL服务');
        }
        catch (error) {
            logger_1.logger.error('❌ 替换数据库服务失败:', error);
            throw error;
        }
    }
    async verifyIntegration() {
        logger_1.logger.info('🔍 验证PostgreSQL集成...');
        try {
            const healthCheck = await this.postgresDb.healthCheck();
            if (!healthCheck.connected) {
                throw new Error(`数据库连接失败: ${healthCheck.error}`);
            }
            const testUser = {
                username: 'integration_test_user',
                email: 'test@example.com',
                password_hash: 'test_hash',
                role: 'user'
            };
            const createdUser = await this.postgresDb.createUser(testUser);
            if (!createdUser) {
                throw new Error('无法创建测试用户');
            }
            const retrievedUser = await this.postgresDb.getUserById(createdUser.id);
            if (!retrievedUser) {
                throw new Error('无法检索创建的用户');
            }
            await this.postgresDb.getPrisma().user.delete({
                where: { id: createdUser.id }
            });
            logger_1.logger.info('✅ PostgreSQL集成验证成功');
        }
        catch (error) {
            logger_1.logger.error('❌ PostgreSQL集成验证失败:', error);
            throw error;
        }
    }
    async getDatabaseStatus() {
        try {
            if (this.isInitialized) {
                const health = await this.postgresDb.healthCheck();
                return {
                    type: 'postgresql',
                    status: health.connected ? 'connected' : 'disconnected',
                    details: health
                };
            }
            else {
                return {
                    type: 'memory',
                    status: 'connected',
                    details: { message: '使用内存数据库' }
                };
            }
        }
        catch (error) {
            return {
                type: 'postgresql',
                status: 'error',
                details: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    async getMigrationStats() {
        try {
            const users = await this.postgresDb.getPrisma().user.findMany();
            const posts = await this.postgresDb.getPrisma().post.findMany();
            return {
                totalUsers: users.length,
                totalPosts: posts.length,
                lastMigrationTime: this.isInitialized ? new Date() : undefined,
                status: this.isInitialized ? 'completed' : 'pending'
            };
        }
        catch (error) {
            return {
                totalUsers: 0,
                totalPosts: 0,
                status: 'failed'
            };
        }
    }
}
exports.DatabaseIntegrationService = DatabaseIntegrationService;
exports.databaseIntegrationService = new DatabaseIntegrationService();
//# sourceMappingURL=database-integration.service.js.map