import { Agent } from '../types';
export declare class AgentService {
    private agents;
    private openai;
    private anthropic;
    constructor();
    private initializeClients;
    registerAgent(agent: Agent): void;
    getAgent(agentId: string): Agent | undefined;
    getAllAgents(): Agent[];
    executeAgent(agentId: string, input: Record<string, any>): Promise<Record<string, any>>;
    private executeOpenAI;
    private executeAnthropic;
    private executeGemini;
    private executeCustom;
}
export declare const agentService: AgentService;
//# sourceMappingURL=agent.service.d.ts.map