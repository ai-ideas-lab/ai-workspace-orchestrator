export declare function parseIntent(userInput: string): Promise<{
    intent: string;
    parameters: Record<string, any>;
}>;
export declare function generateWorkflow(parsedIntent: {
    intent: string;
    parameters: Record<string, any>;
}): Promise<Array<{
    step: string;
    action: string;
    params: Record<string, any>;
}>>;
export declare function executeWorkflow(workflow: Array<{
    step: string;
    action: string;
    params: Record<string, any>;
}>): Promise<{
    status: 'success' | 'error';
    message?: string;
    error?: string;
}>;
//# sourceMappingURL=intentProcessing.d.ts.map