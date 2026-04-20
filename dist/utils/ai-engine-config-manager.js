"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEngineConfigManager = exports.AIEngineConfigManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AIEngineConfigManager {
    constructor(storagePath = './config/ai-engines.json') {
        this.engines = new Map();
        this.groups = new Map();
        this.storagePath = storagePath;
        this.loadConfiguration();
    }
    addEngine(config) {
        const id = this.generateId();
        const now = new Date();
        const engineConfig = {
            ...config,
            id,
            createdAt: now,
            updatedAt: now,
        };
        this.engines.set(id, engineConfig);
        this.saveConfiguration();
        return engineConfig;
    }
    getEngine(id) {
        return this.engines.get(id);
    }
    getEnabledEngines() {
        return Array.from(this.engines.values()).filter(engine => engine.enabled);
    }
    getSortedEngines() {
        return this.getEnabledEngines().sort((a, b) => a.priority - b.priority);
    }
    updateEngine(id, updates) {
        const engine = this.engines.get(id);
        if (!engine)
            return null;
        const updatedEngine = {
            ...engine,
            ...updates,
            updatedAt: new Date(),
        };
        this.engines.set(id, updatedEngine);
        this.saveConfiguration();
        return updatedEngine;
    }
    deleteEngine(id) {
        const deleted = this.engines.delete(id);
        for (const group of this.groups.values()) {
            group.engineIds = group.engineIds.filter(engineId => engineId !== id);
        }
        if (deleted) {
            this.saveConfiguration();
        }
        return deleted;
    }
    addEngineGroup(group) {
        const id = this.generateId();
        const now = new Date();
        const engineGroup = {
            ...group,
            id,
            createdAt: now,
            updatedAt: now,
        };
        this.groups.set(id, engineGroup);
        this.saveConfiguration();
        return engineGroup;
    }
    getEngineGroup(id) {
        return this.groups.get(id);
    }
    getAllEngineGroups() {
        return Array.from(this.groups.values());
    }
    async testEngineConnection(id) {
        const engine = this.engines.get(id);
        if (!engine || !engine.enabled) {
            return false;
        }
        try {
            const startTime = Date.now();
            await new Promise(resolve => setTimeout(resolve, 100));
            const responseTime = Date.now() - startTime;
            if (responseTime > engine.timeout) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error(`Engine ${engine.name} connection test failed:`, error);
            return false;
        }
    }
    async testAllConnections() {
        const results = new Map();
        for (const engine of this.engines.values()) {
            if (engine.enabled) {
                const isConnected = await this.testEngineConnection(engine.id);
                results.set(engine.id, isConnected);
            }
        }
        return results;
    }
    getBestEngine() {
        const enabledEngines = this.getSortedEngines();
        return enabledEngines.length > 0 ? enabledEngines[0] : null;
    }
    generateId() {
        return `engine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    saveConfiguration() {
        try {
            const config = {
                engines: Array.from(this.engines.values()),
                groups: Array.from(this.groups.values()),
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
            };
            const configDir = path_1.default.dirname(this.storagePath);
            if (!fs_1.default.existsSync(configDir)) {
                fs_1.default.mkdirSync(configDir, { recursive: true });
            }
            fs_1.default.writeFileSync(this.storagePath, JSON.stringify(config, null, 2));
        }
        catch (error) {
            console.error('Failed to save AI engine configuration:', error);
        }
    }
    loadConfiguration() {
        try {
            if (fs_1.default.existsSync(this.storagePath)) {
                const configData = fs_1.default.readFileSync(this.storagePath, 'utf8');
                const config = JSON.parse(configData);
                if (config.engines) {
                    this.engines.clear();
                    config.engines.forEach((engine) => {
                        this.engines.set(engine.id, {
                            ...engine,
                            createdAt: new Date(engine.createdAt),
                            updatedAt: new Date(engine.updatedAt),
                        });
                    });
                }
                if (config.groups) {
                    this.groups.clear();
                    config.groups.forEach((group) => {
                        this.groups.set(group.id, {
                            ...group,
                            createdAt: new Date(group.createdAt),
                            updatedAt: new Date(group.updatedAt),
                        });
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to load AI engine configuration:', error);
        }
    }
    getStatistics() {
        const engines = Array.from(this.engines.values());
        const enabledEngines = engines.filter(e => e.enabled);
        const groups = Array.from(this.groups.values());
        return {
            totalEngines: engines.length,
            enabledEngines: enabledEngines.length,
            disabledEngines: engines.length - enabledEngines.length,
            totalGroups: groups.length,
            averagePriority: enabledEngines.length > 0
                ? enabledEngines.reduce((sum, e) => sum + e.priority, 0) / enabledEngines.length
                : 0,
        };
    }
}
exports.AIEngineConfigManager = AIEngineConfigManager;
exports.aiEngineConfigManager = new AIEngineConfigManager();
//# sourceMappingURL=ai-engine-config-manager.js.map