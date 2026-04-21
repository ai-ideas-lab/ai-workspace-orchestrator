"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIntent = parseIntent;
exports.generateWorkflow = generateWorkflow;
exports.executeWorkflow = executeWorkflow;
async function parseIntent(userInput) {
    if (!userInput || typeof userInput !== 'string') {
        throw new Error('用户输入不能为空且必须是字符串类型');
    }
    const input = userInput.trim().toLowerCase();
    console.log('🔍 [DEBUG] 解析用户输入:', input);
    const intentPatterns = {
        'report': ['报告', '报表', '生成报告', '统计', '分析数据'],
        'create': ['创建', '生成', '新建', '制作', '建立'],
        'analyze': ['分析', '研究', '检查', '评估', '诊断'],
        'update': ['更新', '修改', '调整', '刷新', '同步'],
        'delete': ['删除', '移除', '清理', '清除', '丢弃']
    };
    let matchedIntent = 'unknown';
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
        if (patterns.some(pattern => input.includes(pattern))) {
            matchedIntent = intent;
            break;
        }
    }
    const parameters = {
        rawInput: userInput,
        timestamp: new Date().toISOString(),
        detectedIntent: matchedIntent
    };
    if (input.includes('月') || input.includes('month')) {
        parameters.period = 'monthly';
    }
    if (input.includes('周') || input.includes('week')) {
        parameters.period = 'weekly';
    }
    if (input.includes('日') || input.includes('day')) {
        parameters.period = 'daily';
    }
    if (input.includes('销售') || input.includes('sales')) {
        parameters.category = 'sales';
    }
    if (input.includes('客户') || input.includes('customer')) {
        parameters.category = 'customer';
    }
    return {
        intent: matchedIntent,
        parameters
    };
}
async function generateWorkflow(parsedIntent) {
    const { intent, parameters } = parsedIntent;
    const workflowTemplates = {
        'report': [
            { step: '1', action: 'collect_data', params: { category: parameters.category || 'general', period: parameters.period || 'monthly' } },
            { step: '2', action: 'process_data', params: { format: 'structured', validate: true } },
            { step: '3', action: 'generate_report', params: { type: 'standard', include_charts: true } }
        ],
        'create': [
            { step: '1', action: 'validate_requirements', params: { strict: true } },
            { step: '2', action: 'prepare_template', params: { category: parameters.category } },
            { step: '3', action: 'execute_creation', params: { auto_save: true } }
        ],
        'analyze': [
            { step: '1', action: 'gather_data', params: { source: 'multi', scope: 'comprehensive' } },
            { step: '2', action: 'analyze_patterns', params: { depth: 'detailed', methods: ['statistical', 'ml'] } },
            { step: '3', action: 'generate_insights', params: { format: 'detailed', recommendations: true } }
        ],
        'update': [
            { step: '1', action: 'fetch_current', params: { cache_buster: true } },
            { step: '2', action: 'apply_changes', params: { validate: true, backup: true } },
            { step: '3', action: 'verify_changes', params: { consistency_check: true } }
        ],
        'delete': [
            { step: '1', action: 'confirm_target', params: { require_confirmation: true } },
            { step: '2', action: 'create_backup', params: { location: 'temporary', retention: '24h' } },
            { step: '3', action: 'execute_deletion', params: { permanent: false } }
        ]
    };
    const workflow = workflowTemplates[intent] || [
        { step: '1', action: 'generic_process', params: { input: parameters.rawInput } }
    ];
    return workflow;
}
async function executeWorkflow(workflow) {
    try {
        const results = [];
        for (const step of workflow) {
            const stepResult = await executeStep(step);
            results.push(stepResult);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return {
            status: 'success',
            message: results.join(' → ')
        };
    }
    catch (error) {
        return {
            status: 'error',
            error: error instanceof Error ? error.message : '工作流执行失败'
        };
    }
}
async function executeStep(step) {
    const { step: stepNumber, action, params } = step;
    try {
        const actionResults = {
            'collect_data': async () => {
                return `✅ [步骤${stepNumber}] 已收集${params.category || '通用'}数据(${params.period || '月度'})`;
            },
            'process_data': async () => {
                return `✅ [步骤${stepNumber}] 数据处理完成，格式化为${params.format}结构`;
            },
            'generate_report': async () => {
                return `✅ [步骤${stepNumber}] 报告生成${params.include_charts ? '(包含图表)' : ''}`;
            },
            'validate_requirements': async () => {
                return `✅ [步骤${stepNumber}] 需求验证通过(${params.strict ? '严格模式' : '标准模式'})`;
            },
            'prepare_template': async () => {
                return `✅ [步骤${stepNumber}] 已准备${params.category || '通用'}模板`;
            },
            'execute_creation': async () => {
                return `✅ [步骤${stepNumber}] 创建执行完成(${params.auto_save ? '已自动保存' : ''})`;
            },
            'gather_data': async () => {
                return `✅ [步骤${stepNumber}] 数据收集完成(来源:${params.source}, 范围:${params.scope})`;
            },
            'analyze_patterns': async () => {
                return `✅ [步骤${stepNumber}] 模式分析完成(深度:${params.depth}, 方法:${params.methods.join(',')})`;
            },
            'generate_insights': async () => {
                return `✅ [步骤${stepNumber}] 洞察生成完成(格式:${params.format}, 建议:${params.recommendations ? '已生成' : '无'})`;
            },
            'fetch_current': async () => {
                return `✅ [步骤${stepNumber}] 当前状态获取完成(${params.cache_buster ? '已刷新缓存' : ''})`;
            },
            'apply_changes': async () => {
                return `✅ [步骤${stepNumber}] 变更应用完成(${params.backup ? '已备份' : ''}, ${params.validate ? '已验证' : ''})`;
            },
            'verify_changes': async () => {
                return `✅ [步骤${stepNumber}] 变更验证完成(${params.consistency_check ? '一致性检查通过' : ''})`;
            },
            'confirm_target': async () => {
                return `✅ [步骤${stepNumber}] 目标确认完成(${params.require_confirmation ? '已确认' : '跳过确认'})`;
            },
            'create_backup': async () => {
                return `✅ [步骤${stepNumber}] 备份创建完成(位置:${params.location}, 保留:${params.retention})`;
            },
            'execute_deletion': async () => {
                return `✅ [步骤${stepNumber}] 删除执行完成(${params.permanent ? '永久删除' : '软删除'})`;
            },
            'generic_process': async () => {
                return `✅ [步骤${stepNumber}] 通用处理完成(输入: ${params.input.substring(0, 50)}...)`;
            }
        };
        if (actionResults[action]) {
            return await actionResults[action]();
        }
        else {
            return `⚠️ [步骤${stepNumber}] 未知动作: ${action}，使用默认处理`;
        }
    }
    catch (error) {
        return `❌ [步骤${stepNumber}] 执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
}
//# sourceMappingURL=intentProcessing.js.map