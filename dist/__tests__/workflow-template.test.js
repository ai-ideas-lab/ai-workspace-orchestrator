"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const workflow_template_ts_1 = require("../services/workflow-template.ts");
ts;
';;
const makeSteps = () => [
    {
        id: 'step1',
        name: '生成大纲',
        taskType: 'text-generation',
        payload: { prompt: '为 {{topic}} 生成大纲，{{style}} 风格' },
        dependsOn: [],
    },
    {
        id: 'step2',
        name: '扩展内容',
        taskType: 'text-generation',
        payload: { prompt: '根据大纲扩展 {{topic}} 的详细内容' },
        dependsOn: ['step1'],
    },
    {
        id: 'step3',
        name: '润色',
        taskType: 'text-generation',
        payload: { prompt: '润色文章，目标字数 {{wordCount}} 字' },
        dependsOn: ['step2'],
    },
];
(0, globals_1.describe)('WorkflowTemplateService', () => {
    let service;
    (0, globals_1.beforeEach)(() => {
        service = new workflow_template_ts_1.WorkflowTemplateService();
    });
    (0, globals_1.describe)('createTemplate', () => {
        (0, globals_1.it)('should create a template with auto-detected variables', () => {
            const tpl = service.createTemplate({
                name: '内容生成流水线',
                description: '先生成大纲再逐段扩展',
                steps: makeSteps(),
            });
            (0, globals_1.expect)(tpl.id).toBeDefined();
            (0, globals_1.expect)(tpl.name).toBe('内容生成流水线');
            (0, globals_1.expect)(tpl.steps).toHaveLength(3);
            (0, globals_1.expect)(tpl.usageCount).toBe(0);
            (0, globals_1.expect)(tpl.variables.topic).toBeDefined();
            (0, globals_1.expect)(tpl.variables.topic.required).toBe(true);
            (0, globals_1.expect)(tpl.variables.style).toBeDefined();
            (0, globals_1.expect)(tpl.variables.wordCount).toBeDefined();
        });
        (0, globals_1.it)('should merge explicit variable definitions with auto-detected ones', () => {
            const tpl = service.createTemplate({
                name: '测试模板',
                description: '变量合并测试',
                steps: makeSteps(),
                variables: {
                    topic: { description: '文章主题', required: true },
                    style: { description: '写作风格', default: '专业' },
                    extraVar: { description: '额外变量', default: 'foo' },
                },
            });
            (0, globals_1.expect)(tpl.variables.topic.description).toBe('文章主题');
            (0, globals_1.expect)(tpl.variables.style.default).toBe('专业');
            (0, globals_1.expect)(tpl.variables.extraVar).toBeDefined();
            (0, globals_1.expect)(tpl.variables.extraVar.default).toBe('foo');
            (0, globals_1.expect)(tpl.variables.wordCount).toBeDefined();
        });
        (0, globals_1.it)('should throw if name is empty', () => {
            (0, globals_1.expect)(() => service.createTemplate({
                name: '',
                description: '',
                steps: makeSteps(),
            })).toThrow('Template name cannot be empty');
        });
        (0, globals_1.it)('should throw if steps is empty', () => {
            (0, globals_1.expect)(() => service.createTemplate({
                name: '空模板',
                description: '',
                steps: [],
            })).toThrow('Template must have at least one step');
        });
        (0, globals_1.it)('should accept tags', () => {
            const tpl = service.createTemplate({
                name: '标签测试',
                description: '',
                steps: makeSteps(),
                tags: ['content', 'ai', 'pipeline'],
            });
            (0, globals_1.expect)(tpl.tags).toEqual(['content', 'ai', 'pipeline']);
        });
    });
    (0, globals_1.describe)('instantiate', () => {
        (0, globals_1.it)('should instantiate a workflow with all variables resolved', () => {
            const tpl = service.createTemplate({
                name: '内容生成',
                description: '测试',
                steps: makeSteps(),
                variables: {
                    topic: { description: '主题', required: true },
                    style: { description: '风格', default: '正式' },
                    wordCount: { description: '字数', default: '2000' },
                },
            });
            const workflow = service.instantiate(tpl.id, {
                variables: { topic: 'AI教育', style: '轻松' },
            });
            (0, globals_1.expect)(workflow.id).toBeDefined();
            (0, globals_1.expect)(workflow.name).toContain('内容生成');
            (0, globals_1.expect)(workflow.steps).toHaveLength(3);
            (0, globals_1.expect)(workflow.steps[0].payload.prompt).toBe('为 AI教育 生成大纲，轻松 风格');
            (0, globals_1.expect)(workflow.steps[1].payload.prompt).toBe('根据大纲扩展 AI教育 的详细内容');
            (0, globals_1.expect)(workflow.steps[2].payload.prompt).toBe('润色文章，目标字数 2000 字');
        });
        (0, globals_1.it)('should throw if template not found', () => {
            (0, globals_1.expect)(() => service.instantiate('non-existent-id', { variables: {} })).toThrow('Template not found');
        });
        (0, globals_1.it)('should throw if required variable is missing', () => {
            const tpl = service.createTemplate({
                name: '必填测试',
                description: '',
                steps: makeSteps(),
                variables: {
                    topic: { description: '主题', required: true },
                    style: { description: '风格', default: '专业' },
                    wordCount: { description: '字数', default: '1000' },
                },
            });
            (0, globals_1.expect)(() => service.instantiate(tpl.id, { variables: {} })).toThrow('Missing required variable: topic');
        });
        (0, globals_1.it)('should use default values for optional variables', () => {
            const tpl = service.createTemplate({
                name: '默认值测试',
                description: '',
                steps: [
                    {
                        id: 's1',
                        name: '步骤1',
                        taskType: 'text-generation',
                        payload: { text: '{{greeting}} world' },
                        dependsOn: [],
                    },
                ],
                variables: {
                    greeting: { description: '问候语', default: 'hello' },
                },
            });
            const workflow = service.instantiate(tpl.id, { variables: {} });
            (0, globals_1.expect)(workflow.steps[0].payload.text).toBe('hello world');
        });
        (0, globals_1.it)('should increment usage count on each instantiation', () => {
            const tpl = service.createTemplate({
                name: '计数测试',
                description: '',
                steps: makeSteps(),
                variables: {
                    topic: { description: '主题', required: true },
                    style: { description: '风格', default: 'x' },
                    wordCount: { description: '字数', default: '100' },
                },
            });
            service.instantiate(tpl.id, { variables: { topic: 'a' } });
            service.instantiate(tpl.id, { variables: { topic: 'b' } });
            service.instantiate(tpl.id, { variables: { topic: 'c' } });
            const fetched = service.getTemplate(tpl.id);
            (0, globals_1.expect)(fetched.usageCount).toBe(3);
        });
        (0, globals_1.it)('should generate unique step IDs per instantiation', () => {
            const tpl = service.createTemplate({
                name: '唯一ID测试',
                description: '',
                steps: makeSteps(),
                variables: {
                    topic: { description: '主题', required: true },
                    style: { description: '风格', default: 'x' },
                    wordCount: { description: '字数', default: '100' },
                },
            });
            const w1 = service.instantiate(tpl.id, { variables: { topic: 'a' } });
            const w2 = service.instantiate(tpl.id, { variables: { topic: 'b' } });
            (0, globals_1.expect)(w1.steps[0].id).not.toBe(w2.steps[0].id);
        });
        (0, globals_1.it)('should allow custom workflow ID and name', () => {
            const tpl = service.createTemplate({
                name: '自定义ID',
                description: '',
                steps: makeSteps(),
                variables: {
                    topic: { description: '主题', required: true },
                    style: { description: '风格', default: 'x' },
                    wordCount: { description: '字数', default: '100' },
                },
            });
            const workflow = service.instantiate(tpl.id, {
                variables: { topic: 'test' },
                workflowId: 'custom-id-123',
                workflowName: '我的自定义工作流',
            });
            (0, globals_1.expect)(workflow.id).toBe('custom-id-123');
            (0, globals_1.expect)(workflow.name).toBe('我的自定义工作流');
        });
    });
    (0, globals_1.describe)('listTemplates', () => {
        (0, globals_1.it)('should list all templates', () => {
            service.createTemplate({ name: '模板A', description: '', steps: makeSteps() });
            service.createTemplate({ name: '模板B', description: '', steps: makeSteps() });
            const all = service.listTemplates();
            (0, globals_1.expect)(all).toHaveLength(2);
        });
        (0, globals_1.it)('should filter by tag', () => {
            service.createTemplate({ name: 'A', description: '', steps: makeSteps(), tags: ['content'] });
            service.createTemplate({ name: 'B', description: '', steps: makeSteps(), tags: ['data'] });
            service.createTemplate({ name: 'C', description: '', steps: makeSteps(), tags: ['content', 'ai'] });
            const content = service.listTemplates({ tag: 'content' });
            (0, globals_1.expect)(content).toHaveLength(2);
            (0, globals_1.expect)(content.every((t) => t.tags.includes('content'))).toBe(true);
        });
    });
    (0, globals_1.describe)('deleteTemplate', () => {
        (0, globals_1.it)('should delete a template', () => {
            const tpl = service.createTemplate({ name: '删除测试', description: '', steps: makeSteps() });
            (0, globals_1.expect)(service.deleteTemplate(tpl.id)).toBe(true);
            (0, globals_1.expect)(service.getTemplate(tpl.id)).toBeUndefined();
        });
        (0, globals_1.it)('should return false for non-existent template', () => {
            (0, globals_1.expect)(service.deleteTemplate('non-existent')).toBe(false);
        });
    });
    (0, globals_1.describe)('nested payload rendering', () => {
        (0, globals_1.it)('should render variables in nested objects', () => {
            const tpl = service.createTemplate({
                name: '嵌套测试',
                description: '',
                steps: [
                    {
                        id: 's1',
                        name: '嵌套步骤',
                        taskType: 'text-generation',
                        payload: {
                            config: {
                                prompt: '生成关于 {{topic}} 的文章',
                                options: { tone: '{{style}}' },
                            },
                            tags: ['{{topic}}', 'ai'],
                        },
                        dependsOn: [],
                    },
                ],
                variables: {
                    topic: { description: '主题', required: true },
                    style: { description: '风格', default: '专业' },
                },
            });
            const workflow = service.instantiate(tpl.id, {
                variables: { topic: '太空探索', style: '科普' },
            });
            const payload = workflow.steps[0].payload;
            (0, globals_1.expect)(payload.config.prompt).toBe('生成关于 太空探索 的文章');
            (0, globals_1.expect)(payload.config.options.tone).toBe('科普');
            (0, globals_1.expect)(payload.tags).toEqual(['太空探索', 'ai']);
        });
    });
});
//# sourceMappingURL=workflow-template.test.js.map