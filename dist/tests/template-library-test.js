import { workflowTemplateLibrary } from '../services/workflow-template-library.js';
async function testWorkflowTemplateLibrary() {
    console.log('🧪 开始测试工作流模板库...\n');
    console.log('📁 测试1: 初始化内置模板');
    workflowTemplateLibrary.initializeBuiltinTemplates();
    console.log('✅ 内置模板初始化完成\n');
    console.log('📋 测试2: 获取所有模板');
    const allTemplates = workflowTemplateLibrary.getAllTemplates();
    console.log(`✅ 总共找到 ${allTemplates.length} 个模板`);
    allTemplates.forEach(template => {
        console.log(`   - ${template.name} (${template.category}) - ${template.usageCount} 次使用`);
    });
    console.log('');
    console.log('🏷️  测试3: 按分类获取模板');
    const contentTemplates = workflowTemplateLibrary.getTemplatesByCategory('内容创作');
    console.log(`✅ 内容创作模板: ${contentTemplates.length} 个`);
    contentTemplates.forEach(template => {
        console.log(`   - ${template.name}: ${template.description}`);
    });
    console.log('');
    console.log('🔍 测试4: 搜索模板');
    const searchResults = workflowTemplateLibrary.searchTemplates('代码');
    console.log(`✅ 搜索"代码"的结果: ${searchResults.length} 个`);
    searchResults.forEach(template => {
        console.log(`   - ${template.name}: ${template.description}`);
    });
    console.log('');
    console.log('⭐ 测试5: 获取推荐模板');
    const recommendedTemplates = workflowTemplateLibrary.getRecommendedTemplates('user123', 3);
    console.log(`✅ 为用户user123推荐模板: ${recommendedTemplates.length} 个`);
    recommendedTemplates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} (推荐分数: ${template.popularity})`);
    });
    console.log('');
    console.log('📝 测试6: 从模板创建工作流');
    const contentTemplate = allTemplates.find(t => t.name.includes('内容创作'));
    if (contentTemplate) {
        const workflow = workflowTemplateLibrary.createWorkflowFromTemplate(contentTemplate.id, '我的第一个内容创作项目', []);
        if (workflow) {
            console.log('✅ 从模板创建工作流成功:');
            console.log(`   工作流名称: ${workflow.name}`);
            console.log(`   步骤数量: ${workflow.steps.length}`);
            console.log(`   状态: ${workflow.status}`);
            console.log('');
        }
    }
    console.log('💾 测试7: 保存用户自定义模板');
    const sampleWorkflow = {
        id: 'sample-workflow',
        name: '示例工作流',
        description: '这是一个示例工作流',
        steps: [
            {
                id: 'step-1',
                engineId: 'text-gen-1',
                input: '测试输入',
                parameters: { temperature: 0.7 },
                status: 'pending'
            }
        ],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const userTemplate = workflowTemplateLibrary.saveUserTemplate('user123', '我的自定义模板', '这是一个用户创建的自定义模板', sampleWorkflow, ['自定义', '测试']);
    if (userTemplate) {
        console.log('✅ 用户自定义模板保存成功:');
        console.log(`   模板名称: ${userTemplate.name}`);
        console.log(`   分类: ${userTemplate.category}`);
        console.log(`   标签: ${userTemplate.tags.join(', ')}`);
        console.log('');
    }
    console.log('👤 测试8: 获取用户模板');
    const userTemplates = workflowTemplateLibrary.getUserTemplates('user123');
    console.log(`✅ 用户user123的模板: ${userTemplates.length} 个`);
    userTemplates.forEach(template => {
        console.log(`   - ${template.name}`);
    });
    console.log('');
    console.log('🔥 测试9: 获取热门模板');
    const popularTemplates = workflowTemplateLibrary.getPopularTemplates(5);
    console.log(`✅ 热门模板 (Top 5):`);
    popularTemplates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} - ${template.usageCount} 次使用`);
    });
    console.log('');
    console.log('📊 测试10: 获取模板统计');
    const templateStats = workflowTemplateLibrary.getTemplateStats();
    console.log('✅ 模板库统计:');
    console.log(`   内置模板: ${templateStats.builtinTemplates}`);
    console.log(`   用户模板: ${templateStats.userTemplates}`);
    console.log(`   总模板数: ${templateStats.totalTemplates}`);
    console.log(`   总使用次数: ${templateStats.totalUsage}`);
    console.log(`   平均使用次数: ${templateStats.averageUsage.toFixed(1)}`);
    console.log('');
    console.log('📈 测试11: 更新模板使用统计');
    if (allTemplates.length > 0) {
        const firstTemplate = allTemplates[0];
        const beforeUsage = firstTemplate.usageCount;
        workflowTemplateLibrary.updateTemplateUsage(firstTemplate.id);
        const afterUsage = firstTemplate.usageCount;
        console.log(`✅ 模板"${firstTemplate.name}"使用统计更新:`);
        console.log(`   更新前: ${beforeUsage} 次`);
        console.log(`   更新后: ${afterUsage} 次`);
        console.log('');
    }
    console.log('🎉 工作流模板库测试完成！');
    console.log('🚀 核心功能已实现，项目可以开始使用模板库功能');
}
testWorkflowTemplateLibrary().catch(console.error);
//# sourceMappingURL=template-library-test.js.map