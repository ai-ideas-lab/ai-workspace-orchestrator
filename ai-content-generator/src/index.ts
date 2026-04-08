import { contentGeneratorService } from './services/content-generator-service';

export class ContentGeneratorApp {
  async start(): Promise<void> {
    console.log('AI Content Generator 启动中...');
    
    try {
      // 演示用户查询
      const user = await contentGeneratorService.getUserById('1');
      console.log('查询到用户:', user);
      
      // 演示内容搜索
      const searchResults = await contentGeneratorService.searchContent('编程');
      console.log('搜索结果:', searchResults.length, '条结果');
      
      // 演示生成推荐
      const recommendations = await contentGeneratorService.generateRecommendations('1');
      console.log('推荐内容:', recommendations.length, '条推荐');
      
    } catch (error) {
      console.error('应用启动失败:', error);
    }
  }
}

const app = new ContentGeneratorApp();
app.start().catch(console.error);