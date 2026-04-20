import { naturalLanguageParser } from '../services/natural-language-parser.js';
async function testNaturalLanguageParser() {
    console.log('🧪 开始测试自然语言解析器...\n');
    const testCommands = [
        '创建一个工作流：文本生成任务，参数：{"temperature": 0.7}',
        '运行刚才创建的工作流，优先级：高',
        '查询所有工作流的状态',
        '删除工作流：项目报告',
        '配置AI引擎：启用文本生成引擎',
        '帮我生成一个营销文案，要今天完成'
    ];
    for (const command of testCommands) {
        console.log(`📝 测试命令: "${command}"`);
        try {
            const result = await naturalLanguageParser.parseCommand(command);
            console.log('✅ 解析结果:');
            console.log(`   意图: ${result.intent}`);
            console.log(`   置信度: ${result.confidence.toFixed(2)}`);
            console.log(`   实体:`, result.entities);
            console.log(`   建议操作:`, result.suggestedActions);
            console.log('---\n');
        }
        catch (error) {
            console.error('❌ 解析失败:', error);
            console.log('---\n');
        }
    }
    console.log('🧪 自然语言解析器测试完成');
}
testNaturalLanguageParser().catch(console.error);
//# sourceMappingURL=nlp-test.js.map