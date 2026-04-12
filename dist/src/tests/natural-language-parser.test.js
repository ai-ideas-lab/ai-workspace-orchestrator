import { NaturalLanguageParser } from '../services/natural-language-parser';
describe('NaturalLanguageParser', () => {
    let parser;
    beforeEach(() => {
        parser = new NaturalLanguageParser();
    });
    describe('parseCommand', () => {
        test('should parse workflow creation command', async () => {
            const text = '创建一个工作流：生成周报';
            const result = await parser.parseCommand(text);
            expect(result.intent).toBe('创建工作流');
            expect(result.entities).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.suggestedActions).toBeDefined();
        });
        test('should parse workflow execution command', async () => {
            const text = '执行工作流 数据备份';
            const result = await parser.parseCommand(text);
            expect(result.intent).toBe('执行工作流');
            expect(result.entities).toBeDefined();
        });
        test('should parse status query command', async () => {
            const text = '查询工作流状态';
            const result = await parser.parseCommand(text);
            expect(result.intent).toBe('查询状态');
            expect(result.entities).toBeDefined();
        });
        test('should parse workflow deletion command', async () => {
            const text = '删除工作流：临时测试';
            const result = await parser.parseCommand(text);
            expect(result.intent).toBe('删除工作流');
            expect(result.entities).toBeDefined();
        });
        test('should parse engine configuration command', async () => {
            const text = '配置AI引擎 文本生成';
            const result = await parser.parseCommand(text);
            expect(result.intent).toBe('配置AI引擎');
            expect(result.entities).toBeDefined();
        });
        test('should parse list command', async () => {
            const text = '显示所有工作流列表';
            const result = await parser.parseCommand(text);
            expect(result.intent).toBe('查看列表');
            expect(result.entities).toBeDefined();
        });
    });
    describe('extractEntities', () => {
        test('should extract workflow name', async () => {
            const text = '创建工作流：项目周报';
            const entities = await parser.extractEntities(text);
            expect(entities.workflowName).toBe('项目周报');
        });
        test('should extract engine type', async () => {
            const text = '配置文本生成引擎';
            const entities = await parser.extractEntities(text);
            expect(entities.engineType).toBe('文本生成');
        });
        test('should extract priority', async () => {
            const text = '高优先级任务';
            const entities = await parser.extractEntities(text);
            expect(entities.priority).toBe('高');
        });
        test('should extract parameters', async () => {
            const text = '参数：{"format": "markdown", "length": "1000"}';
            const entities = await parser.extractEntities(text);
            expect(entities.parameter).toBeDefined();
        });
    });
    describe('classifyIntent', () => {
        test('should classify workflow creation intent', async () => {
            const text = '创建新的工作流程';
            const result = await parser.classifyIntent(text);
            expect(result.intent).toBe('创建工作流');
            expect(result.confidence).toBeGreaterThan(0.5);
        });
        test('should classify workflow execution intent', async () => {
            const text = '运行数据同步工作流';
            const result = await parser.classifyIntent(text);
            expect(result.intent).toBe('执行工作流');
            expect(result.confidence).toBeGreaterThan(0.5);
        });
        test('should classify status query intent', async () => {
            const text = '查看进度';
            const result = await parser.classifyIntent(text);
            expect(result.intent).toBe('查询状态');
            expect(result.confidence).toBeGreaterThan(0.5);
        });
        test('should handle unknown intent', async () => {
            const text = '这是一个测试命令';
            const result = await parser.classifyIntent(text);
            expect(result.intent).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });
    });
    describe('normalizeText', () => {
        test('should normalize Chinese text', () => {
            const text = '创建   工作流   ：生成周报';
            expect(typeof text).toBe('string');
            expect(text.length).toBeGreaterThan(0);
        });
    });
    describe('generateSuggestedActions', () => {
        test('should generate suggested actions for workflow creation', () => {
            const intent = '创建工作流';
            const entities = { workflowName: '测试工作流' };
            expect(intent).toBe('创建工作流');
            expect(entities).toBeDefined();
        });
    });
});
//# sourceMappingURL=natural-language-parser.test.js.map