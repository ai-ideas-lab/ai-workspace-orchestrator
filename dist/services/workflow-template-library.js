export class WorkflowTemplateLibrary {
    templates = new Map();
    userTemplates = new Map();
    initializeBuiltinTemplates() {
        const builtinTemplates = [
            {
                id: 'content-creation-workflow',
                name: '内容创作工作流',
                description: '自动生成文章、博客、营销文案等内容',
                category: '内容创作',
                tags: ['写作', '营销', '创意'],
                isBuiltin: true,
                popularity: 95,
                usageCount: 1250,
                workflow: this.createContentCreationWorkflow()
            },
            {
                id: 'code-review-workflow',
                name: '代码审查工作流',
                description: '自动检查代码质量、安全性和最佳实践',
                category: '开发工具',
                tags: ['代码', '审查', '质量'],
                isBuiltin: true,
                popularity: 88,
                usageCount: 890,
                workflow: this.createCodeReviewWorkflow()
            },
            {
                id: 'image-processing-workflow',
                name: '图像处理工作流',
                description: '批量处理图像、生成变体、优化质量',
                category: '图像处理',
                tags: ['图像', '编辑', '优化'],
                isBuiltin: true,
                popularity: 76,
                usageCount: 654,
                workflow: this.createImageProcessingWorkflow()
            },
            {
                id: 'data-analysis-workflow',
                name: '数据分析工作流',
                description: '数据处理、分析和可视化自动化',
                category: '数据分析',
                tags: ['数据', '分析', '可视化'],
                isBuiltin: true,
                popularity: 82,
                usageCount: 723,
                workflow: this.createDataAnalysisWorkflow()
            },
            {
                id: 'customer-support-workflow',
                name: '客服回复工作流',
                description: '智能生成客服回复、分类和优先级处理',
                category: '客户服务',
                tags: ['客服', '回复', '分类'],
                isBuiltin: true,
                popularity: 91,
                usageCount: 1102,
                workflow: this.createCustomerSupportWorkflow()
            }
        ];
        builtinTemplates.forEach(template => {
            this.templates.set(template.id, template);
            console.log(`✅ 注册内置模板: ${template.name}`);
        });
        console.log(`📋 内置模板库初始化完成，共 ${builtinTemplates.length} 个模板`);
    }
    getAllTemplates() {
        return Array.from(this.templates.values());
    }
    getTemplatesByCategory(category) {
        return Array.from(this.templates.values()).filter(template => template.category === category);
    }
    searchTemplates(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.templates.values()).filter(template => template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    getRecommendedTemplates(userId, limit = 5) {
        const userHistory = this.getUserUsageHistory(userId);
        const allTemplates = Array.from(this.templates.values());
        const scoredTemplates = allTemplates.map(template => {
            let score = template.popularity * 0.3;
            const usedTags = userHistory.flatMap(h => h.tags);
            const matchedTags = template.tags.filter(tag => usedTags.includes(tag));
            score += matchedTags.length * 20;
            if (userHistory.some(h => h.category === template.category)) {
                score += 30;
            }
            return { ...template, recommendationScore: score };
        });
        return scoredTemplates
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit)
            .map(({ recommendationScore, ...template }) => template);
    }
    createWorkflowFromTemplate(templateId, customName, customSteps) {
        const template = this.templates.get(templateId);
        if (!template) {
            console.error(`模板未找到: ${templateId}`);
            return null;
        }
        const workflowName = customName || `${template.name} - ${new Date().toLocaleDateString()}`;
        const workflow = {
            id: `workflow-${Date.now()}`,
            name: workflowName,
            description: template.description,
            steps: customSteps || template.workflow.steps.map(step => ({
                ...step,
                id: `${step.id}-${Date.now()}`,
                status: 'pending',
                input: step.input,
                parameters: step.parameters || {}
            })),
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        console.log(`📝 从模板创建工作流: ${workflowName}`);
        return workflow;
    }
    saveUserTemplate(userId, name, description, workflow, tags = []) {
        const template = {
            id: `user-template-${Date.now()}`,
            name,
            description,
            category: '自定义',
            tags,
            isBuiltin: false,
            popularity: 0,
            usageCount: 0,
            workflow,
            createdAt: new Date(),
            createdBy: userId
        };
        if (!this.userTemplates.has(userId)) {
            this.userTemplates.set(userId, []);
        }
        this.userTemplates.get(userId).push(template);
        console.log(`💾 用户保存模板: ${name}`);
        return template;
    }
    getUserTemplates(userId) {
        return this.userTemplates.get(userId) || [];
    }
    deleteUserTemplate(userId, templateId) {
        const userTemplateList = this.userTemplates.get(userId);
        if (!userTemplateList)
            return false;
        const index = userTemplateList.findIndex(t => t.id === templateId);
        if (index !== -1) {
            userTemplateList.splice(index, 1);
            console.log(`🗑️ 用户删除模板: ${templateId}`);
            return true;
        }
        return false;
    }
    updateTemplateUsage(templateId) {
        const template = this.templates.get(templateId);
        if (template) {
            template.usageCount++;
            template.popularity = Math.min(100, template.popularity + 0.1);
            console.log(`📊 更新模板使用统计: ${template.name} (${template.usageCount} 次)`);
        }
    }
    getPopularTemplates(limit = 10) {
        return Array.from(this.templates.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }
    getTemplateStats() {
        const builtinCount = Array.from(this.templates.values()).filter(t => t.isBuiltin).length;
        const userTemplateCount = Array.from(this.userTemplates.values()).flat().length;
        const totalUsage = Array.from(this.templates.values()).reduce((sum, t) => sum + t.usageCount, 0);
        return {
            builtinTemplates: builtinCount,
            userTemplates: userTemplateCount,
            totalTemplates: builtinCount + userTemplateCount,
            totalUsage,
            averageUsage: builtinCount > 0 ? totalUsage / builtinCount : 0
        };
    }
    getUserUsageHistory(userId) {
        return [
            { category: '内容创作', tags: ['写作', '营销'] },
            { category: '开发工具', tags: ['代码', '审查'] }
        ];
    }
    createContentCreationWorkflow() {
        return {
            id: 'content-creation-base',
            name: '内容创作基础工作流',
            description: '内容创作工作流',
            steps: [
                {
                    id: 'step-1',
                    engineId: 'text-gen-1',
                    input: '用户需求描述',
                    parameters: { temperature: 0.7, maxTokens: 1000 },
                    status: 'pending'
                },
                {
                    id: 'step-2',
                    engineId: 'text-gen-1',
                    input: '初步草稿',
                    parameters: { temperature: 0.5, maxTokens: 800 },
                    status: 'pending'
                },
                {
                    id: 'step-3',
                    engineId: 'text-gen-1',
                    input: '优化后的内容',
                    parameters: { temperature: 0.6, maxTokens: 1200 },
                    status: 'pending'
                }
            ],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createCodeReviewWorkflow() {
        return {
            id: 'code-review-base',
            name: '代码审查基础工作流',
            description: '代码审查工作流',
            steps: [
                {
                    id: 'step-1',
                    engineId: 'code-analysis-1',
                    input: '源代码',
                    parameters: { analysisType: 'security', depth: 'detailed' },
                    status: 'pending'
                },
                {
                    id: 'step-2',
                    engineId: 'code-analysis-1',
                    input: '安全分析结果',
                    parameters: { analysisType: 'performance', depth: 'standard' },
                    status: 'pending'
                },
                {
                    id: 'step-3',
                    engineId: 'text-gen-1',
                    input: '分析报告',
                    parameters: { temperature: 0.3, maxTokens: 1500 },
                    status: 'pending'
                }
            ],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createImageProcessingWorkflow() {
        return {
            id: 'image-processing-base',
            name: '图像处理基础工作流',
            description: '图像处理工作流',
            steps: [
                {
                    id: 'step-1',
                    engineId: 'image-gen-1',
                    input: '原始图像',
                    parameters: { operation: 'enhance', quality: 'high' },
                    status: 'pending'
                },
                {
                    id: 'step-2',
                    engineId: 'image-gen-1',
                    input: '增强后的图像',
                    parameters: { operation: 'resize', dimensions: '1024x768' },
                    status: 'pending'
                }
            ],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createDataAnalysisWorkflow() {
        return {
            id: 'data-analysis-base',
            name: '数据分析基础工作流',
            description: '数据分析工作流',
            steps: [
                {
                    id: 'step-1',
                    engineId: 'text-gen-1',
                    input: '原始数据',
                    parameters: { task: 'clean', format: 'structured' },
                    status: 'pending'
                },
                {
                    id: 'step-2',
                    engineId: 'text-gen-1',
                    input: '清洗后的数据',
                    parameters: { task: 'analyze', method: 'statistical' },
                    status: 'pending'
                }
            ],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createCustomerSupportWorkflow() {
        return {
            id: 'customer-support-base',
            name: '客服支持基础工作流',
            description: '客服支持工作流',
            steps: [
                {
                    id: 'step-1',
                    engineId: 'text-gen-1',
                    input: '客户问题',
                    parameters: { task: 'classify', categories: ['技术咨询', '投诉', '建议'] },
                    status: 'pending'
                },
                {
                    id: 'step-2',
                    engineId: 'text-gen-1',
                    input: '分类结果',
                    parameters: { task: 'respond', tone: 'professional', length: 'medium' },
                    status: 'pending'
                }
            ],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
export const workflowTemplateLibrary = new WorkflowTemplateLibrary();
//# sourceMappingURL=workflow-template-library.js.map