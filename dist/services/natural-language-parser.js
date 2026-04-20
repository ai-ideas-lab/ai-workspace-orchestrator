import { z } from 'zod';
const CommandTypeSchema = z.enum([
    'create_meeting',
    'schedule_task',
    'analyze_data',
    'generate_report',
    'send_email',
    'make_phone_call',
    'search_web',
    'create_document',
    'schedule_reminder',
    'start_workflow'
]);
const CommandSchema = z.object({
    type: CommandTypeSchema,
    parameters: z.object({}).passthrough(),
    confidence: z.number().min(0).max(1),
    originalText: z.string(),
    timestamp: z.string()
});
export class NaturalLanguageParser {
    commandPatterns = new Map();
    constructor() {
        this.initializePatterns();
    }
    initializePatterns() {
        this.commandPatterns.set('create_meeting', /创建|安排|组织|会议/gi);
        this.commandPatterns.set('schedule_task', /计划|安排|任务|待办/gi);
        this.commandPatterns.set('analyze_data', /分析|数据|统计|报告/gi);
        this.commandPatterns.set('generate_report', /生成|报告|文档|总结/gi);
        this.commandPatterns.set('send_email', /发送|邮件|email/gi);
        this.commandPatterns.set('make_phone_call', /打电话|电话|通话/gi);
        this.commandPatterns.set('search_web', /搜索|查找|搜索|web/gi);
        this.commandPatterns.set('create_document', /创建|文档|文件|文档/gi);
        this.commandPatterns.set('schedule_reminder', /提醒|闹钟|通知/gi);
        this.commandPatterns.set('start_workflow', /启动|开始|工作流|流程/gi);
    }
    async parseCommand(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid text input');
        }
        const trimmedText = text.trim();
        let matchedType = null;
        let maxConfidence = 0;
        for (const [type, pattern] of this.commandPatterns) {
            const matches = trimmedText.match(pattern);
            if (matches && matches.length > 0) {
                const confidence = matches.length / trimmedText.length;
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    matchedType = type;
                }
            }
        }
        if (!matchedType) {
            matchedType = 'start_workflow';
        }
        const parameters = this.extractParameters(trimmedText, matchedType);
        return {
            type: matchedType,
            parameters,
            confidence: maxConfidence,
            originalText: trimmedText,
            timestamp: new Date().toISOString()
        };
    }
    extractParameters(text, commandType) {
        const parameters = {};
        const timeMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}点|今天|明天|后天|本周|下周)/);
        if (timeMatch) {
            parameters.time = timeMatch[1];
        }
        const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}月\d{1,2}日)/);
        if (dateMatch) {
            parameters.date = dateMatch[1];
        }
        const peopleMatch = text.match(/(@\w+|用户|同事|客户)/g);
        if (peopleMatch) {
            parameters.people = peopleMatch;
        }
        const locationMatch = text.match(/(会议室|办公室|地点|位置)/);
        if (locationMatch) {
            parameters.location = locationMatch[1];
        }
        return parameters;
    }
    addCommandPattern(type, pattern) {
        this.commandPatterns.set(type, pattern);
    }
    getAvailableCommands() {
        return Array.from(this.commandPatterns.keys());
    }
}
//# sourceMappingURL=natural-language-parser.js.map