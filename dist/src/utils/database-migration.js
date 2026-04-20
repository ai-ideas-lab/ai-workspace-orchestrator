import { PostgresDatabaseService } from '../services/postgres-database-service';
import { DatabaseService } from '../services/database-service';
import { promises as fs } from 'fs';
export class DatabaseMigration {
    postgresDb;
    sqliteDb;
    constructor() {
        this.postgresDb = PostgresDatabaseService.getInstance();
        this.sqliteDb = DatabaseService.getInstance();
    }
    async migrate() {
        console.log('🚀 Starting database migration from SQLite to PostgreSQL...');
        try {
            console.log('Step 1: Initializing PostgreSQL database...');
            await this.postgresDb.initialize();
            console.log('Step 2: Checking SQLite database...');
            const sqliteExists = await this.checkSqliteDatabaseExists();
            if (!sqliteExists) {
                console.log('⚠️  SQLite database not found. Skipping data migration.');
                return;
            }
            console.log('Step 3: Migrating users...');
            await this.migrateUsers();
            console.log('Step 4: Migrating AI engines...');
            await this.migrateAIEngines();
            console.log('Step 5: Migrating workflows...');
            await this.migrateWorkflows();
            console.log('Step 6: Migrating workflow steps...');
            await this.migrateWorkflowSteps();
            console.log('Step 7: Migrating workflow executions...');
            await this.migrateWorkflowExecutions();
            console.log('Step 8: Migrating step execution history...');
            await this.migrateStepExecutionHistory();
            console.log('✅ Database migration completed successfully!');
        }
        catch (error) {
            console.error('❌ Database migration failed:', error);
            throw error;
        }
    }
    async checkSqliteDatabaseExists() {
        try {
            const dbPath = process.env.DATABASE_URL || './dev.db';
            const resolvedPath = dbPath.startsWith('file:') ? dbPath.slice(5) : dbPath;
            await fs.access(resolvedPath);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async migrateUsers() {
        console.log('  - Migrating users...');
        const users = await this.sqliteDb.all('SELECT * FROM users');
        if (users.length === 0) {
            console.log('  - No users to migrate');
            return;
        }
        const bcrypt = require('bcryptjs');
        for (const user of users) {
            try {
                let passwordHash = user.password_hash;
                if (!passwordHash || passwordHash.length < 60) {
                    passwordHash = await bcrypt.hash(passwordHash || 'default123', 12);
                }
                await this.postgresDb.prisma.user.create({
                    data: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        password_hash: passwordHash,
                        role: user.role || 'user',
                        created_at: new Date(user.created_at),
                        updated_at: user.updated_at ? new Date(user.updated_at) : new Date(),
                    },
                });
            }
            catch (error) {
                console.error(`  - Error migrating user ${user.username}:`, error);
            }
        }
        console.log(`  - Migrated ${users.length} users`);
    }
    async migrateAIEngines() {
        console.log('  - Migrating AI engines...');
        const engines = await this.sqliteDb.all('SELECT * FROM ai_engines');
        if (engines.length === 0) {
            console.log('  - No AI engines to migrate');
            return;
        }
        for (const engine of engines) {
            try {
                await this.postgresDb.prisma.aIEngine.create({
                    data: {
                        id: engine.id,
                        name: engine.name,
                        type: engine.type,
                        endpoint: engine.endpoint,
                        capabilities: engine.capabilities,
                        status: engine.status || 'active',
                        load: engine.load || 0.0,
                        created_at: new Date(engine.created_at),
                        updated_at: engine.updated_at ? new Date(engine.updated_at) : new Date(),
                    },
                });
            }
            catch (error) {
                console.error(`  - Error migrating AI engine ${engine.name}:`, error);
            }
        }
        console.log(`  - Migrated ${engines.length} AI engines`);
    }
    async migrateWorkflows() {
        console.log('  - Migrating workflows...');
        const workflows = await this.sqliteDb.all('SELECT * FROM workflows');
        if (workflows.length === 0) {
            console.log('  - No workflows to migrate');
            return;
        }
        for (const workflow of workflows) {
            try {
                await this.postgresDb.prisma.workflow.create({
                    data: {
                        id: workflow.id,
                        user_id: workflow.user_id,
                        name: workflow.name,
                        description: workflow.description,
                        status: workflow.status || 'draft',
                        config: workflow.config ? JSON.parse(workflow.config) : null,
                        created_at: new Date(workflow.created_at),
                        updated_at: workflow.updated_at ? new Date(workflow.updated_at) : new Date(),
                    },
                });
            }
            catch (error) {
                console.error(`  - Error migrating workflow ${workflow.name}:`, error);
            }
        }
        console.log(`  - Migrated ${workflows.length} workflows`);
    }
    async migrateWorkflowSteps() {
        console.log('  - Migrating workflow steps...');
        const steps = await this.sqliteDb.all('SELECT * FROM workflow_steps');
        if (steps.length === 0) {
            console.log('  - No workflow steps to migrate');
            return;
        }
        for (const step of steps) {
            try {
                await this.postgresDb.prisma.workflowStep.create({
                    data: {
                        id: step.id,
                        workflow_id: step.workflow_id,
                        engine_id: step.engine_id,
                        name: step.name,
                        input: step.input ? JSON.parse(step.input) : null,
                        parameters: step.parameters ? JSON.parse(step.parameters) : null,
                        output: step.output ? JSON.parse(step.output) : null,
                        status: step.status || 'pending',
                        error_message: step.error_message,
                        sequence_order: step.sequence_order || 0,
                        created_at: new Date(step.created_at),
                        updated_at: step.updated_at ? new Date(step.updated_at) : new Date(),
                    },
                });
            }
            catch (error) {
                console.error(`  - Error migrating workflow step ${step.name}:`, error);
            }
        }
        console.log(`  - Migrated ${steps.length} workflow steps`);
    }
    async migrateWorkflowExecutions() {
        console.log('  - Migrating workflow executions...');
        const executions = await this.sqliteDb.all('SELECT * FROM workflow_executions');
        if (executions.length === 0) {
            console.log('  - No workflow executions to migrate');
            return;
        }
        for (const execution of executions) {
            try {
                await this.postgresDb.prisma.workflowExecution.create({
                    data: {
                        id: execution.id,
                        workflow_id: execution.workflow_id,
                        user_id: execution.user_id,
                        status: execution.status || 'running',
                        trigger_data: execution.trigger_data ? JSON.parse(execution.trigger_data) : null,
                        result: execution.result ? JSON.parse(execution.result) : null,
                        error_message: execution.error_message,
                        started_at: execution.started_at ? new Date(execution.started_at) : null,
                        completed_at: execution.completed_at ? new Date(execution.completed_at) : null,
                        execution_time_ms: execution.execution_time_ms,
                        created_at: new Date(execution.created_at),
                    },
                });
            }
            catch (error) {
                console.error(`  - Error migrating workflow execution ${execution.id}:`, error);
            }
        }
        console.log(`  - Migrated ${executions.length} workflow executions`);
    }
    async migrateStepExecutionHistory() {
        console.log('  - Migrating step execution history...');
        const history = await this.sqliteDb.all('SELECT * FROM step_execution_history');
        if (history.length === 0) {
            console.log('  - No step execution history to migrate');
            return;
        }
        for (const record of history) {
            try {
                await this.postgresDb.prisma.stepExecutionHistory.create({
                    data: {
                        id: record.id,
                        execution_id: record.execution_id,
                        step_id: record.step_id,
                        status: record.status,
                        input_data: record.input_data ? JSON.parse(record.input_data) : null,
                        output_data: record.output_data ? JSON.parse(record.output_data) : null,
                        error_message: record.error_message,
                        start_time: record.start_time ? new Date(record.start_time) : null,
                        end_time: record.end_time ? new Date(record.end_time) : null,
                        duration_ms: record.duration_ms,
                        created_at: new Date(record.created_at),
                    },
                });
            }
            catch (error) {
                console.error(`  - Error migrating step execution history ${record.id}:`, error);
            }
        }
        console.log(`  - Migrated ${history.length} step execution records`);
    }
    async generateMigrationReport() {
        try {
            const [userCount, engineCount, workflowCount, stepCount, executionCount, historyCount] = await Promise.all([
                this.postgresDb.prisma.user.count(),
                this.postgresDb.prisma.aIEngine.count(),
                this.postgresDb.prisma.workflow.count(),
                this.postgresDb.prisma.workflowStep.count(),
                this.postgresDb.prisma.workflowExecution.count(),
                this.postgresDb.prisma.stepExecutionHistory.count(),
            ]);
            const totalRecords = userCount + engineCount + workflowCount + stepCount + executionCount + historyCount;
            return {
                totalRecords,
                tables: ['users', 'ai_engines', 'workflows', 'workflow_steps', 'workflow_executions', 'step_execution_history'],
                warnings: [],
                errors: [],
            };
        }
        catch (error) {
            return {
                totalRecords: 0,
                tables: [],
                warnings: [],
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
}
export const dbMigration = new DatabaseMigration();
//# sourceMappingURL=database-migration.js.map