"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentService = exports.AgentService = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
const openai_1 = require("openai");
const sdk_1 = require("@anthropic-ai/sdk");
class AgentService {
    constructor() {
        this.agents = new Map();
        this.initializeClients();
    }
    initializeClients() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            logger_1.logger.info('OpenAI client initialized');
        }
        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropic = new sdk_1.Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
            logger_1.logger.info('Anthropic client initialized');
        }
    }
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        logger_1.logger.info(`Agent registered: ${agent.name} (${agent.id})`);
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    async executeAgent(agentId, input) {
        const agent = this.getAgent(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        logger_1.logger.info(`Executing agent: ${agent.name}`, { agentId, input });
        try {
            let result;
            switch (agent.type) {
                case types_1.AgentType.OPENAI:
                    result = await this.executeOpenAI(agent, input);
                    break;
                case types_1.AgentType.ANTHROPIC:
                    result = await this.executeAnthropic(agent, input);
                    break;
                case types_1.AgentType.GEMINI:
                    result = await this.executeGemini(agent, input);
                    break;
                case types_1.AgentType.CUSTOM:
                    result = await this.executeCustom(agent, input);
                    break;
                default:
                    throw new Error(`Unsupported agent type: ${agent.type}`);
            }
            logger_1.logger.info(`Agent execution completed: ${agent.name}`, { result });
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Agent execution failed: ${agent.name}`, { error: error.message });
            throw error;
        }
    }
    async executeOpenAI(agent, input) {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }
        const config = agent.config;
        const response = await this.openai.chat.completions.create({
            model: config.model || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: config.systemPrompt || 'You are a helpful AI assistant.',
                },
                {
                    role: 'user',
                    content: JSON.stringify(input),
                },
            ],
            max_tokens: config.maxTokens || 1000,
            temperature: config.temperature || 0.7,
            ...config.customParams,
        });
        return {
            content: response.choices[0]?.message?.content || '',
            usage: response.usage,
            model: response.model,
        };
    }
    async executeAnthropic(agent, input) {
        if (!this.anthropic) {
            throw new Error('Anthropic client not initialized');
        }
        const config = agent.config;
        const response = await this.anthropic.messages.create({
            model: config.model || 'claude-3-sonnet-20240229',
            max_tokens: config.maxTokens || 1000,
            temperature: config.temperature || 0.7,
            system: config.systemPrompt || 'You are a helpful AI assistant.',
            messages: [
                {
                    role: 'user',
                    content: JSON.stringify(input),
                },
            ],
            ...config.customParams,
        });
        return {
            content: response.content[0]?.text || '',
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            model: response.model,
        };
    }
    async executeGemini(agent, input) {
        throw new Error('Gemini agent implementation not yet available');
    }
    async executeCustom(agent, input) {
        throw new Error('Custom agent implementation not yet available');
    }
}
exports.AgentService = AgentService;
exports.agentService = new AgentService();
//# sourceMappingURL=agent.service.js.map