export function trackDevelopmentProgress(feature: string, status: 'pending' | 'in-progress' | 'completed', progress: number) {
    const timestamp = new Date().toISOString();
    const progressEntry = {
        feature,
        status,
        progress,
        timestamp,
        id: Math.random().toString(36).substr(2, 9)
    };
    
    console.log(`[${timestamp}] ${feature}: ${status} (${progress}%)`);
    return progressEntry;
}

export function generateProgressReport(features: any[]) {
    const totalFeatures = features.length;
    const completed = features.filter(f => f.status === 'completed').length;
    const inProgress = features.filter(f => f.status === 'in-progress').length;
    const pending = features.filter(f => f.status === 'pending').length;
    
    return {
        total: totalFeatures,
        completed,
        inProgress, 
        pending,
        completionRate: Math.round((completed / totalFeatures) * 100)
    };
}