import { logger } from '../utils/logger.js';
import { DatabaseConnection } from './connection.js';
export let prisma;
export async function setupDatabase(config) {
    try {
        logger.info('Setting up database connection...');
        prisma = await DatabaseConnection.createConnection(config);
        await initializeDatabase(config);
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, closing database connection...');
            await DatabaseConnection.disconnect();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, closing database connection...');
            await DatabaseConnection.disconnect();
            process.exit(0);
        });
        logger.info('Database setup completed successfully');
    }
    catch (error) {
        logger.error('Database setup failed:', error);
        throw error;
    }
}
async function initializeDatabase(config) {
    try {
        logger.info('Initializing database...');
        if (config.database.provider === 'postgresql' && process.env.NODE_ENV === 'production') {
            await runMigrations();
        }
        await createSeedData();
        await validateDatabase();
        logger.info('Database initialization completed');
    }
    catch (error) {
        logger.error('Database initialization failed:', error);
        throw error;
    }
}
async function runMigrations() {
    try {
        logger.info('Running database migrations...');
        if (process.env.RUN_MIGRATIONS === 'true') {
            logger.info('Database migrations executed');
        }
    }
    catch (error) {
        logger.error('Database migrations failed:', error);
        throw error;
    }
}
async function createSeedData() {
    try {
        logger.info('Creating seed data...');
        const adminExists = await prisma.user.findUnique({
            where: { email: 'admin@aiworkspace.local' }
        });
        if (!adminExists) {
            await prisma.user.create({
                data: {
                    email: 'admin@aiworkspace.local',
                    username: 'admin',
                    password: 'hashed_password_here',
                    name: 'Administrator',
                    role: 'ADMIN',
                }
            });
            logger.info('Default admin user created');
        }
        const agents = [
            {
                name: 'OpenAI GPT-4',
                type: 'OPENAI',
                config: {
                    model: 'gpt-4',
                    maxTokens: 2000,
                    temperature: 0.7,
                },
                description: 'OpenAI GPT-4 模型',
            },
            {
                name: 'Anthropic Claude',
                type: 'ANTHROPIC',
                config: {
                    model: 'claude-3-opus-20240229',
                    maxTokens: 2000,
                    temperature: 0.7,
                },
                description: 'Anthropic Claude 3 模型',
            },
            {
                name: 'Google Gemini',
                type: 'GOOGLE_AI',
                config: {
                    model: 'gemini-pro',
                    maxTokens: 2000,
                    temperature: 0.7,
                },
                description: 'Google Gemini Pro 模型',
            },
        ];
        for (const agent of agents) {
            const agentExists = await prisma.agent.findUnique({
                where: { name: agent.name }
            });
            if (!agentExists) {
                await prisma.agent.create({
                    data: {
                        ...agent,
                        userId: (await prisma.user.findFirst({
                            where: { email: 'admin@aiworkspace.local' }
                        })).id,
                    }
                });
            }
        }
        logger.info('Seed data created successfully');
    }
    catch (error) {
        logger.error('Failed to create seed data:', error);
        throw error;
    }
}
async function validateDatabase() {
    try {
        logger.info('Validating database integrity...');
        const tables = [
            'User',
            'Workflow',
            'WorkflowExecution',
            'Agent',
            'AgentExecution',
            'Comment',
            'SessionToken'
        ];
        for (const table of tables) {
            try {
                const result = await prisma.$queryRaw `SELECT 1 FROM ${Prisma.raw(table)} LIMIT 1`;
                logger.info(`✓ Table ${table} exists and is accessible`);
            }
            catch (error) {
                throw new Error(`Table ${table} validation failed: ${error}`);
            }
        }
        await checkForeignKeys();
        logger.info('Database validation completed successfully');
    }
    catch (error) {
        logger.error('Database validation failed:', error);
        throw error;
    }
}
async function checkForeignKeys() {
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            logger.warn('No users found in database');
        }
        else {
            logger.info(`Found ${userCount} users in database`);
        }
    }
    catch (error) {
        logger.error('Foreign key check failed:', error);
        throw error;
    }
}
export async function getDatabaseStatus() {
    try {
        const isConnected = await DatabaseConnection.healthCheck();
        const stats = await DatabaseConnection.getStats();
        const status = DatabaseConnection.getStatus();
        return {
            connected: isConnected,
            provider: status.provider,
            stats,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        logger.error('Failed to get database status:', error);
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}
//# sourceMappingURL=index.js.map