export interface WorkflowConfig {
    name?: unknown;
    steps?: unknown;
    timeout?: unknown;
    retryLimit?: unknown;
    environment?: unknown;
}
export interface WorkflowStep {
    id?: unknown;
    name?: unknown;
    taskType?: unknown;
    payload?: unknown;
    dependsOn?: unknown;
}
export declare function validateConfig(cfg: WorkflowConfig): string[];
export declare function validateStep(step: unknown, index: number): string[];
export declare function validateConfigWithReport(cfg: WorkflowConfig): ConfigReport;
export interface ConfigReport {
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
export declare function isProductionReady(cfg: WorkflowConfig): boolean;
//# sourceMappingURL=config-validator.d.ts.map