import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
export class DatabaseService {
    static instance;
    db = null;
    isInitialized = false;
    constructor() { }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            const dbPath = process.env.DATABASE_URL || './dev.db';
            const resolvedPath = dbPath.startsWith('file:') ? dbPath.slice(5) : dbPath;
            const dbDir = path.dirname(resolvedPath);
            await fs.mkdir(dbDir, { recursive: true });
            this.db = new sqlite3.Database(resolvedPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                }
                else {
                    console.log('✅ Database connected successfully');
                }
            });
            await this.createTables();
            this.isInitialized = true;
        }
        catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }
    async createTables() {
        if (!this.db)
            throw new Error('Database not initialized');
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )`,
            `CREATE TABLE IF NOT EXISTS ai_engines (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        endpoint TEXT,
        capabilities TEXT, -- JSON
        status TEXT DEFAULT 'active',
        load REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )`,
            `CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        description TEXT,
        status TEXT DEFAULT 'draft',
        config TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
            `CREATE TABLE IF NOT EXISTS workflow_steps (
        id TEXT PRIMARY KEY,
        workflow_id TEXT,
        engine_id TEXT,
        name TEXT,
        input TEXT, -- JSON
        parameters TEXT, -- JSON
        output TEXT, -- JSON
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        sequence_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id),
        FOREIGN KEY (engine_id) REFERENCES ai_engines (id)
      )`,
            `CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT,
        user_id TEXT,
        status TEXT DEFAULT 'running',
        trigger_data TEXT, -- JSON
        result TEXT, -- JSON
        error_message TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        execution_time_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
            `CREATE TABLE IF NOT EXISTS step_execution_history (
        id TEXT PRIMARY KEY,
        execution_id TEXT,
        step_id TEXT,
        status TEXT,
        input_data TEXT, -- JSON
        output_data TEXT, -- JSON
        error_message TEXT,
        start_time DATETIME,
        end_time DATETIME,
        duration_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES workflow_executions (id),
        FOREIGN KEY (step_id) REFERENCES workflow_steps (id)
      )`,
            `CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        category TEXT,
        config TEXT, -- JSON
        tags TEXT, -- JSON
        usage_count INTEGER DEFAULT 0,
        created_by TEXT,
        is_public BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )`,
            `CREATE TABLE IF NOT EXISTS user_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        template_id TEXT,
        name TEXT,
        config TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (template_id) REFERENCES templates (id),
        UNIQUE(user_id, template_id)
      )`,
            `CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        level TEXT,
        message TEXT,
        metadata TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
        ];
        for (const query of queries) {
            await this.run(query);
        }
        console.log('✅ Database tables created successfully');
    }
    async run(query, params = []) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }
    async get(query, params = []) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    async all(query, params = []) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    getDb() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }
    async testConnection() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            await this.get('SELECT 1');
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
    async disconnect() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log('✅ Database connection closed');
                        resolve();
                    }
                });
            });
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            const connected = await this.testConnection();
            const latency = Date.now() - startTime;
            return {
                status: connected ? 'healthy' : 'unhealthy',
                connected,
                latency,
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                status: 'unhealthy',
                connected: false,
                latency,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async clear() {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Database cleanup only allowed in development mode');
        }
        const tables = [
            'user_templates',
            'templates',
            'step_execution_history',
            'workflow_executions',
            'workflow_steps',
            'workflows',
            'ai_engines',
            'users',
            'system_logs'
        ];
        for (const table of tables) {
            await this.run(`DELETE FROM ${table}`);
        }
        console.log('✅ Database cleared successfully');
    }
}
export const db = DatabaseService.getInstance();
//# sourceMappingURL=database-service.js.map