/**
 * 工作空间辅助函数集合
 * 提供快速任务处理和资源管理功能
 */

export function prioritizeTasks(tasks: string[]): string[] {
    /**
     * 根据任务紧急程度和重要性进行排序
     * @param tasks 任务列表
     * @returns 排序后的任务列表
     */
    return tasks.sort((a, b) => {
        const priorityMap = {
            'urgent': 3,
            'important': 2,
            'normal': 1,
            'low': 0
        };
        
        const getPriority = (task: string): number => {
            for (const [key, value] of Object.entries(priorityMap)) {
                if (task.toLowerCase().includes(key)) {
                    return value;
                }
            }
            return priorityMap['normal'];
        };
        
        return getPriority(b) - getPriority(a);
    });
}

export function cleanupWorkspace(path: string): number {
    /**
     * 清理工作空间中的临时文件
     * @param path 工作空间路径
     * @return 清理的文件数量
     */
    // 简化实现 - 实际项目中可能需要更复杂的清理逻辑
    console.log(`清理工作空间: ${path}`);
    return 0;
}

export function generateQuickReport(tasks: string[], completed: number): string {
    /**
     * 生成快速进度报告
     * @param tasks 任务列表
     * @param completed 已完成任务数
     * @returns 报告文本
     */
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return `任务进度: ${completed}/${total} (${percentage}%)
状态: ${percentage >= 80 ? '✅ 接近完成' : percentage >= 50 ? '🔄 进行中' : '🚀 刚开始'}
预计剩余时间: ${Math.ceil((total - completed) * 0.5)}分钟`;
}