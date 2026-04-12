export interface AIEngineConfig {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'google' | 'custom';
    endpoint?: string;
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    enabled: boolean;
    priority: number;
    timeout: number;
    retryAttempts: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface AIEngineGroup {
    id: string;
    name: string;
    description: string;
    engineIds: string[];
    loadBalancingStrategy: 'round-robin' | 'weighted' | 'performance';
    createdAt: Date;
    updatedAt: Date;
}
export declare class AIEngineConfigManager {
    private engines;
    private groups;
    private storagePath;
    constructor(storagePath?: string);
    addEngine(config: Omit<AIEngineConfig, 'id' | 'createdAt' | 'updatedAt'>): AIEngineConfig;
    getEngine(id: string): AIEngineConfig | undefined;
    getEnabledEngines(): AIEngineConfig[];
    getSortedEngines(): AIEngineConfig[];
    updateEngine(id: string, updates: Partial<AIEngineConfig>): AIEngineConfig | null;
    deleteEngine(id: string): boolean;
    addEngineGroup(group: Omit<AIEngineGroup, 'id' | 'createdAt' | 'updatedAt'>): AIEngineGroup;
    getEngineGroup(id: string): AIEngineGroup | undefined;
    getAllEngineGroups(): AIEngineGroup[];
    testEngineConnection(id: string): Promise<boolean>;
    testAllConnections(): Promise<Map<string, boolean>>;
    getBestEngine(): AIEngineConfig | null;
    private generateId;
    private saveConfiguration;
    private loadConfiguration;
    getStatistics(): {
        totalEngines: number;
        enabledEngines: number;
        disabledEngines: number;
        totalGroups: number;
        averagePriority: number;
    };
}
export declare const aiEngineConfigManager: AIEngineConfigManager;
//# sourceMappingURL=ai-engine-config-manager.d.ts.map