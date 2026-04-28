/**
 * WorkflowTemplateService 单元测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { WorkflowTemplateService } from '../services/workflow-template';
import type { WorkflowStep } from '../services/workflow-executor'';

// ── 测试用步骤模板 ──────────────────────────────────────

const makeSteps = (): WorkflowStep[] => [
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

describe('WorkflowTemplateService', () => {
  let service: WorkflowTemplateService;

  beforeEach(() => {
    service = new WorkflowTemplateService();
  });

  // ── createTemplate ────────────────────────────────────

  describe('createTemplate', () => {
    it('should create a template with auto-detected variables', () => {
      const tpl = service.createTemplate({
        name: '内容生成流水线',
        description: '先生成大纲再逐段扩展',
        steps: makeSteps(),
      });

      expect(tpl.id).toBeDefined();
      expect(tpl.name).toBe('内容生成流水线');
      expect(tpl.steps).toHaveLength(3);
      expect(tpl.usageCount).toBe(0);

      // 自动检测到 topic, style, wordCount
      expect(tpl.variables.topic).toBeDefined();
      expect(tpl.variables.topic.required).toBe(true);
      expect(tpl.variables.style).toBeDefined();
      expect(tpl.variables.wordCount).toBeDefined();
    });

    it('should merge explicit variable definitions with auto-detected ones', () => {
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

      // 显式定义覆盖自动检测
      expect(tpl.variables.topic.description).toBe('文章主题');
      expect(tpl.variables.style.default).toBe('专业');

      // 额外变量保留
      expect(tpl.variables.extraVar).toBeDefined();
      expect(tpl.variables.extraVar.default).toBe('foo');

      // 自动检测的 wordCount 保留
      expect(tpl.variables.wordCount).toBeDefined();
    });

    it('should throw if name is empty', () => {
      expect(() =>
        service.createTemplate({
          name: '',
          description: '',
          steps: makeSteps(),
        }),
      ).toThrow('Template name cannot be empty');
    });

    it('should throw if steps is empty', () => {
      expect(() =>
        service.createTemplate({
          name: '空模板',
          description: '',
          steps: [],
        }),
      ).toThrow('Template must have at least one step');
    });

    it('should accept tags', () => {
      const tpl = service.createTemplate({
        name: '标签测试',
        description: '',
        steps: makeSteps(),
        tags: ['content', 'ai', 'pipeline'],
      });

      expect(tpl.tags).toEqual(['content', 'ai', 'pipeline']);
    });
  });

  // ── instantiate ────────────────────────────────────────

  describe('instantiate', () => {
    it('should instantiate a workflow with all variables resolved', () => {
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

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toContain('内容生成');
      expect(workflow.steps).toHaveLength(3);

      // topic 替换
      expect(workflow.steps[0].payload.prompt).toBe(
        '为 AI教育 生成大纲，轻松 风格',
      );
      // style 使用传入值
      expect(workflow.steps[1].payload.prompt).toBe(
        '根据大纲扩展 AI教育 的详细内容',
      );
      // wordCount 使用默认值
      expect(workflow.steps[2].payload.prompt).toBe(
        '润色文章，目标字数 2000 字',
      );
    });

    it('should throw if template not found', () => {
      expect(() =>
        service.instantiate('non-existent-id', { variables: {} }),
      ).toThrow('Template not found');
    });

    it('should throw if required variable is missing', () => {
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

      expect(() =>
        service.instantiate(tpl.id, { variables: {} }),
      ).toThrow('Missing required variable: topic');
    });

    it('should use default values for optional variables', () => {
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
      expect(workflow.steps[0].payload.text).toBe('hello world');
    });

    it('should increment usage count on each instantiation', () => {
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

      const fetched = service.getTemplate(tpl.id)!;
      expect(fetched.usageCount).toBe(3);
    });

    it('should generate unique step IDs per instantiation', () => {
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

      // 每次实例化的步骤 ID 应该不同
      expect(w1.steps[0].id).not.toBe(w2.steps[0].id);
    });

    it('should allow custom workflow ID and name', () => {
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

      expect(workflow.id).toBe('custom-id-123');
      expect(workflow.name).toBe('我的自定义工作流');
    });
  });

  // ── 辅助方法 ──────────────────────────────────────────

  describe('listTemplates', () => {
    it('should list all templates', () => {
      service.createTemplate({ name: '模板A', description: '', steps: makeSteps() });
      service.createTemplate({ name: '模板B', description: '', steps: makeSteps() });

      const all = service.listTemplates();
      expect(all).toHaveLength(2);
    });

    it('should filter by tag', () => {
      service.createTemplate({ name: 'A', description: '', steps: makeSteps(), tags: ['content'] });
      service.createTemplate({ name: 'B', description: '', steps: makeSteps(), tags: ['data'] });
      service.createTemplate({ name: 'C', description: '', steps: makeSteps(), tags: ['content', 'ai'] });

      const content = service.listTemplates({ tag: 'content' });
      expect(content).toHaveLength(2);
      expect(content.every((t) => t.tags.includes('content'))).toBe(true);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', () => {
      const tpl = service.createTemplate({ name: '删除测试', description: '', steps: makeSteps() });
      expect(service.deleteTemplate(tpl.id)).toBe(true);
      expect(service.getTemplate(tpl.id)).toBeUndefined();
    });

    it('should return false for non-existent template', () => {
      expect(service.deleteTemplate('non-existent')).toBe(false);
    });
  });

  // ── 嵌套 payload 渲染 ─────────────────────────────────

  describe('nested payload rendering', () => {
    it('should render variables in nested objects', () => {
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

      const payload = workflow.steps[0].payload as any;
      expect(payload.config.prompt).toBe('生成关于 太空探索 的文章');
      expect(payload.config.options.tone).toBe('科普');
      expect(payload.tags).toEqual(['太空探索', 'ai']);
    });
  });
});
