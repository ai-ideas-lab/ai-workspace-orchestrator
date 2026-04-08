export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

export interface Content {
  id: string;
  title: string;
  content: string;
  authorId: string;
  type: 'article' | 'blog' | 'social';
  createdAt: Date;
}

export class ContentGeneratorService {
  private users: User[] = [
    { id: '1', name: '张三', email: 'zhangsan@example.com' },
    { id: '2', name: '李四', email: 'lisi@example.com' },
    { id: '3', name: '王五', email: 'wangwu@example.com' },
  ];

  private contents: Content[] = [
    { id: '1', title: '如何提高编程效率', content: '提高编程效率的几个关键因素...', authorId: '1', type: 'article', createdAt: new Date() },
    { id: '2', title: 'AI技术发展趋势', content: 'AI技术在各个领域的应用...', authorId: '2', type: 'blog', createdAt: new Date() },
    { id: '3', title: '健康生活小贴士', content: '保持健康生活习惯的重要性...', authorId: '3', type: 'social', createdAt: new Date() },
  ];

  // 问题1: 重复的用户查询逻辑
  async getUserById(id: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 30)); // 模拟数据库延迟
    
    return this.users.find(user => user.id === id) || null;
  }

  // 问题2: 重复的内容搜索逻辑
  async searchContent(query: string): Promise<Content[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟数据库延迟
    
    return this.contents.filter(content => 
      content.title.includes(query) || content.content.includes(query)
    );
  }

  // 问题3: 重复的用户内容获取
  async getUserContent(userId: string): Promise<Content[]> {
    await new Promise(resolve => setTimeout(resolve, 50)); // 模拟数据库延迟
    
    return this.contents.filter(content => content.authorId === userId);
  }

  // 生成个性化内容推荐
  async generateRecommendations(userId: string): Promise<Content[]> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 基于用户偏好生成推荐
    const recommendedContents = [...this.contents];
    
    // 简单的推荐算法
    if (user.preferences?.theme === 'dark') {
      // 暗色主题用户可能更喜欢技术类内容
      recommendedContents.sort((a, b) => {
        const techScore = a.type === 'article' ? 1 : 0;
        return techScore - (b.type === 'article' ? 1 : 0);
      });
    }

    return recommendedContents.slice(0, 3);
  }

  // 重复的用户信息更新
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.preferences = { ...user.preferences, ...preferences };
    return user;
  }
}

export const contentGeneratorService = new ContentGeneratorService();