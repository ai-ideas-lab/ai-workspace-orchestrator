"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = exports.DatabaseService = void 0;
class DatabaseService {
    constructor() {
        this.users = [
            { id: '1', name: '张三', email: 'zhangsan@example.com' },
            { id: '2', name: '李四', email: 'lisi@example.com' },
            { id: '3', name: '王五', email: 'wangwu@example.com' },
            { id: '4', name: '赵六', email: 'zhaoliu@example.com' },
            { id: '5', name: '钱七', email: 'qianqi@example.com' },
        ];
        this.posts = [
            { id: '1', title: '第一篇博客', content: '这是第一篇博客的内容', authorId: '1', createdAt: new Date() },
            { id: '2', title: '第二篇博客', content: '这是第二篇博客的内容', authorId: '1', createdAt: new Date() },
            { id: '3', title: '第三篇博客', content: '这是第三篇博客的内容', authorId: '2', createdAt: new Date() },
            { id: '4', title: '第四篇博客', content: '这是第四篇博客的内容', authorId: '2', createdAt: new Date() },
            { id: '5', title: '第五篇博客', content: '这是第五篇博客的内容', authorId: '3', createdAt: new Date() },
            { id: '6', title: '第六篇博客', content: '这是第六篇博客的内容', authorId: '1', createdAt: new Date() },
            { id: '7', title: '第七篇博客', content: '这是第七篇博客的内容', authorId: '4', createdAt: new Date() },
            { id: '8', title: '第八篇博客', content: '这是第八篇博客的内容', authorId: '5', createdAt: new Date() },
        ];
    }
    // 问题1: N+1 查询问题
    async getAllUsersWithPosts() {
        const users = [...this.users];
        // 这里存在 N+1 问题：每个用户都单独查询一次帖子
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            user.posts = await this.getPostsByUserId(user.id);
        }
        return users;
    }
    // 问题2: 重复查询用户信息
    async getPostsByUserId(userId) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 模拟数据库延迟
        return this.posts.filter(post => post.authorId === userId);
    }
    // 问题3: 低效的全文搜索
    async searchPosts(query) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟数据库延迟
        return this.posts.filter(post => post.title.includes(query) || post.content.includes(query));
    }
    // 问题4: 重复的用户查询
    async getUserById(id) {
        await new Promise(resolve => setTimeout(resolve, 30)); // 模拟数据库延迟
        return this.users.find(user => user.id === id) || null;
    }
    // 优化版本: 批量查询
    async getAllUsersWithPostsOptimized() {
        const users = [...this.users];
        // 一次性获取所有帖子
        const allPosts = [...this.posts];
        // 内存中关联，避免多次数据库查询
        for (const user of users) {
            user.posts = allPosts.filter(post => post.authorId === user.id);
        }
        return users;
    }
}
exports.DatabaseService = DatabaseService;
exports.dbService = new DatabaseService();
//# sourceMappingURL=database-service.js.map