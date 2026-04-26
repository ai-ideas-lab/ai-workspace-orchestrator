export function quickProgress(task: string, progress: number): string {
    return `[${"=".repeat(progress)}${" ".repeat(100 - progress)}] ${progress}% - ${task}`;
}

export function isTaskComplete(progress: number): boolean {
    return progress >= 100;
}
