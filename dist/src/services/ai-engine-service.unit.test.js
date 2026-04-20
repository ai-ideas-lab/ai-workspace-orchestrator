import { aiEngineService } from './ai-engine-service';
describe('AI Engine Service Unit Tests', () => {
    describe('Engine Selection', () => {
        test('should select Claude-3 for coding tasks', async () => {
            const engine = await aiEngineService.selectBestEngine('coding');
            expect(engine).toBe('Claude-3');
        });
        test('should select Claude-3 for analysis tasks', async () => {
            const engine = await aiEngineService.selectBestEngine('analysis');
            expect(engine).toBe('Claude-3');
        });
        test('should select ChatGPT-4 for writing tasks', async () => {
            const engine = await aiEngineService.selectBestEngine('writing');
            expect(engine).toBe('ChatGPT-4');
        });
        test('should select Gemini-Pro for translation tasks', async () => {
            const engine = await aiEngineService.selectBestEngine('translate');
            expect(engine).toBe('Gemini-Pro');
        });
        test('should select ChatGPT-4 for general tasks by default', async () => {
            const engine = await aiEngineService.selectBestEngine('general');
            expect(engine).toBe('ChatGPT-4');
        });
    });
    describe('Task Validation', () => {
        test('should validate correct task', () => {
            const task = {
                type: 'analysis',
                prompt: '分析人工智能的发展趋势',
                requirements: { depth: 'detailed' }
            };
            const validation = aiEngineService.validateTask(task);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        test('should reject task with empty prompt', () => {
            const task = {
                type: 'analysis',
                prompt: '',
            };
            const validation = aiEngineService.validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('任务内容不能为空');
        });
        test('should reject task with invalid type', () => {
            const task = {
                type: 'invalid',
                prompt: 'test prompt',
            };
            const validation = aiEngineService.validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('任务类型必须是: analysis, writing, coding, general 之一');
        });
        test('should reject task with prompt too long', () => {
            const longPrompt = 'a'.repeat(50001);
            const task = {
                type: 'analysis',
                prompt: longPrompt,
            };
            const validation = aiEngineService.validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('任务内容过长，最大支持50,000字符');
        });
    });
    describe('Cost Estimation', () => {
        test('should estimate ChatGPT-4 cost correctly', async () => {
            const cost = await aiEngineService.estimateTaskCost('ChatGPT-4', 'test prompt');
            expect(cost.estimatedCost).toBeGreaterThan(0);
            expect(cost.currency).toBe('USD');
        });
        test('should estimate Gemini-Pro cost correctly', async () => {
            const cost = await aiEngineService.estimateTaskCost('Gemini-Pro', 'test prompt');
            expect(cost.estimatedCost).toBeGreaterThanOrEqual(0);
            expect(cost.currency).toBe('USD');
        });
        test('should use estimated tokens if provided', async () => {
            const estimatedTokens = 1000;
            const cost = await aiEngineService.estimateTaskCost('ChatGPT-4', 'test prompt', estimatedTokens);
            const expectedCost = estimatedTokens * 0.00006;
            expect(cost.estimatedCost).toBe(expectedCost);
        });
    });
    describe('Available Engines', () => {
        test('should return all available engines with status', () => {
            const engines = aiEngineService.getAvailableEngines();
            expect(engines).toHaveLength(3);
            expect(engines.map(e => e.name)).toContain('ChatGPT-4');
            expect(engines.map(e => e.name)).toContain('Claude-3');
            expect(engines.map(e => e.name)).toContain('Gemini-Pro');
            engines.forEach(engine => {
                expect(engine.status).toBe('active');
                expect(engine.capabilities).toBeInstanceOf(Array);
                expect(engine.maxTokens).toBeGreaterThan(0);
                expect(engine.costPerToken).toBeGreaterThan(0);
            });
        });
    });
    describe('Error Handling', () => {
        test('should handle invalid engine name gracefully', async () => {
            await expect(aiEngineService.executeAITask('Invalid-Engine', {
                type: 'general',
                prompt: 'test'
            })).rejects.toThrow('AI engine Invalid-Engine not found');
        });
    });
});
//# sourceMappingURL=ai-engine-service.unit.test.js.map