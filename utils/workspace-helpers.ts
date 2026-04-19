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

export function checkSystemHealth(): { status: 'healthy' | 'warning' | 'critical'; score: number; message: string } {
    /**
     * 快速系统健康检查
     * @returns 健康状态对象
     */
    const metrics = {
        memory: Math.random() > 0.3,  // 模拟内存检查
        cpu: Math.random() > 0.2,     // 模拟CPU检查
        network: Math.random() > 0.1,  // 模拟网络检查
        storage: Math.random() > 0.25  // 模拟存储检查
    };
    
    const healthScore = Object.values(metrics).filter(Boolean).length;
    const maxScore = Object.keys(metrics).length;
    const percentage = (healthScore / maxScore) * 100;
    
    let status: 'healthy' | 'warning' | 'critical';
    let message: string;
    
    if (percentage >= 80) {
        status = 'healthy';
        message = '🟢 系统运行正常';
    } else if (percentage >= 50) {
        status = 'warning';
        message = '🟡 系统部分组件需要关注';
    } else {
        status = 'critical';
        message = '🔴 系统存在严重问题，需要立即处理';
    }
    
    return { status, score: percentage, message };
}

export function quickStart(): string {
    /**
     * 快速开始工作流执行
     * @returns 启动消息
     */
    return '🚀 AI工作流执行器已启动，准备处理您的指令！';
}