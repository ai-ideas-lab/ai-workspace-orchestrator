export class NaturalLanguageParser {
    async parseCommand(command) {
        const intent = this.analyzeIntent(command);
        const entities = this.extractEntities(command);
        const suggestedActions = this.generateSuggestedActions(intent, entities);
        const confidence = this.calculateConfidence(command, intent);
        return {
            intent,
            confidence,
            entities,
            suggestedActions
        };
    }
    analyzeIntent(command) {
        const normalizedCommand = command.toLowerCase();
        const intentMappings = [
            { intent: 'workflow_generation', keywords: ['创建', '生成', '制作', '建立', '设计'] },
            { intent: 'workflow_execution', keywords: ['运行', '执行', '启动', '开始', '运行'] },
            { intent: 'workflow_analysis', keywords: ['分析', '查看', '检查', '监控', '统计'] },
            { intent: 'workflow_optimization', keywords: ['优化', '改进', '升级', '增强', '提升'] },
            { intent: 'template_management', keywords: ['模板', '模板库', '收藏', '分类', '标签'] }
        ];
        for (const mapping of intentMappings) {
            if (mapping.keywords.some(keyword => normalizedCommand.includes(keyword))) {
                return mapping.intent;
            }
        }
        return 'general';
    }
    extractEntities(command) {
        const entities = [];
        const timePatterns = [
            /\d{4}-\d{2}-\d{2}/g,
            /\d{1,2}:\d{2}/g,
            /今天|明天|昨天|本周|本月/g
        ];
        timePatterns.forEach(pattern => {
            const matches = command.match(pattern);
            if (matches) {
                entities.push(...matches);
            }
        });
        const numberPattern = /\d+/g;
        const numbers = command.match(numberPattern);
        if (numbers) {
            entities.push(...numbers);
        }
        const specificKeywords = ['工作流', '模板', 'AI', '机器学习', '数据分析'];
        specificKeywords.forEach(keyword => {
            if (command.includes(keyword)) {
                entities.push(keyword);
            }
        });
        return Array.from(new Set(entities));
    }
    generateSuggestedActions(intent, entities) {
        const actionMap = {
            'workflow_generation': [
                '创建新工作流',
                '选择工作流模板',
                '配置工作流参数',
                '保存工作流配置'
            ],
            'workflow_execution': [
                '执行工作流',
                '查看执行状态',
                '监控执行进度',
                '获取执行结果'
            ],
            'workflow_analysis': [
                '分析工作流性能',
                '查看执行统计',
                '识别瓶颈',
                '生成分析报告'
            ],
            'workflow_optimization': [
                '优化工作流配置',
                '调整参数设置',
                '改进执行效率',
                '升级工作流版本'
            ],
            'template_management': [
                '浏览模板库',
                '搜索相关模板',
                '收藏模板',
                '创建自定义模板'
            ],
            'general': [
                '创建新工作流',
                '浏览模板库',
                '查看工作流列表',
                '获取帮助'
            ]
        };
        return actionMap[intent] || actionMap['general'];
    }
    calculateConfidence(command, intent) {
        const baseConfidence = 0.6;
        const lengthBonus = Math.min(command.length / 200, 0.3);
        const intentKeywords = {
            'workflow_generation': ['创建', '生成', '制作'],
            'workflow_execution': ['执行', '运行', '启动'],
            'workflow_analysis': ['分析', '查看', '检查'],
            'workflow_optimization': ['优化', '改进', '升级'],
            'template_management': ['模板', '收藏', '分类']
        };
        const keywordMatches = intentKeywords[intent]?.filter(keyword => command.toLowerCase().includes(keyword)).length || 0;
        const keywordBonus = keywordMatches * 0.1;
        return Math.min(baseConfidence + lengthBonus + keywordBonus, 1.0);
    }
}
export const naturalLanguageParser = new NaturalLanguageParser();
//# sourceMappingURL=natural-language-parser.js.map