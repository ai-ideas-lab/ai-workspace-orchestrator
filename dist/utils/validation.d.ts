import { z } from 'zod';
export declare const createWorkflowSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["AI_TASK", "HUMAN_TASK", "DATA_PROCESSING", "NOTIFICATION", "VALIDATION"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION";
        config: Record<string, any>;
        name: string;
        order: number;
        dependencies: string[];
    }, {
        type: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION";
        config: Record<string, any>;
        name: string;
        order: number;
        dependencies?: string[] | undefined;
    }>, "many">;
    trigger: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["manual", "scheduled", "webhook", "event"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "scheduled" | "webhook" | "event" | "manual";
        config: Record<string, any>;
    }, {
        type: "scheduled" | "webhook" | "event" | "manual";
        config: Record<string, any>;
    }>>;
}, "strip", z.ZodTypeAny, {
    steps: {
        type: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION";
        config: Record<string, any>;
        name: string;
        order: number;
        dependencies: string[];
    }[];
    name: string;
    description?: string | undefined;
    trigger?: {
        type: "scheduled" | "webhook" | "event" | "manual";
        config: Record<string, any>;
    } | undefined;
}, {
    steps: {
        type: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION";
        config: Record<string, any>;
        name: string;
        order: number;
        dependencies?: string[] | undefined;
    }[];
    name: string;
    description?: string | undefined;
    trigger?: {
        type: "scheduled" | "webhook" | "event" | "manual";
        config: Record<string, any>;
    } | undefined;
}>;
export declare const updateWorkflowSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "ARCHIVED" | "PUBLISHED" | undefined;
    description?: string | undefined;
    config?: Record<string, any> | undefined;
    name?: string | undefined;
}, {
    status?: "DRAFT" | "ARCHIVED" | "PUBLISHED" | undefined;
    description?: string | undefined;
    config?: Record<string, any> | undefined;
    name?: string | undefined;
}>;
export declare const executeWorkflowSchema: z.ZodObject<{
    inputData: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    inputData: Record<string, any>;
    userId?: string | undefined;
}, {
    userId?: string | undefined;
    inputData?: Record<string, any> | undefined;
}>;
export declare const createStepSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["AI_TASK", "HUMAN_TASK", "DATA_PROCESSING", "NOTIFICATION", "VALIDATION"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION";
    config: Record<string, any>;
    name: string;
    order: number;
    dependencies: string[];
}, {
    type: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION";
    config: Record<string, any>;
    name: string;
    order: number;
    dependencies?: string[] | undefined;
}>;
export declare const updateStepSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["AI_TASK", "HUMAN_TASK", "DATA_PROCESSING", "NOTIFICATION", "VALIDATION"]>>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION" | undefined;
    config?: Record<string, any> | undefined;
    name?: string | undefined;
    order?: number | undefined;
    dependencies?: string[] | undefined;
}, {
    type?: "AI_TASK" | "HUMAN_TASK" | "DATA_PROCESSING" | "NOTIFICATION" | "VALIDATION" | undefined;
    config?: Record<string, any> | undefined;
    name?: string | undefined;
    order?: number | undefined;
    dependencies?: string[] | undefined;
}>;
export declare const createAIEngineSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["openai", "anthropic", "google"]>;
    endpoint: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodArray<z.ZodString, "many">;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "openai" | "anthropic" | "google";
    name: string;
    capabilities: string[];
    config?: Record<string, any> | undefined;
    endpoint?: string | undefined;
}, {
    type: "openai" | "anthropic" | "google";
    name: string;
    capabilities: string[];
    config?: Record<string, any> | undefined;
    endpoint?: string | undefined;
}>;
export declare const executeAITaskSchema: z.ZodObject<{
    task: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        systemPrompt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        temperature?: number | undefined;
        systemPrompt?: string | undefined;
        maxTokens?: number | undefined;
    }, {
        model?: string | undefined;
        temperature?: number | undefined;
        systemPrompt?: string | undefined;
        maxTokens?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    task: string;
    options?: {
        model?: string | undefined;
        temperature?: number | undefined;
        systemPrompt?: string | undefined;
        maxTokens?: number | undefined;
    } | undefined;
}, {
    task: string;
    options?: {
        model?: string | undefined;
        temperature?: number | undefined;
        systemPrompt?: string | undefined;
        maxTokens?: number | undefined;
    } | undefined;
}>;
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    executionTime: z.ZodOptional<z.ZodNumber>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        pages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        total: number;
        page: number;
        pages: number;
    }, {
        limit: number;
        total: number;
        page: number;
        pages: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data?: any;
    error?: string | undefined;
    executionTime?: number | undefined;
    pagination?: {
        limit: number;
        total: number;
        page: number;
        pages: number;
    } | undefined;
}, {
    success: boolean;
    data?: any;
    error?: string | undefined;
    executionTime?: number | undefined;
    pagination?: {
        limit: number;
        total: number;
        page: number;
        pages: number;
    } | undefined;
}>;
export declare class ValidationError extends Error {
    details?: any | undefined;
    constructor(message: string, details?: any | undefined);
}
export declare class APIError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, data: any) => T;
export declare const sanitizeInput: (input: any) => any;
export declare const generateId: () => string;
export declare const formatDuration: (ms: number) => string;
export declare const isProduction: () => boolean;
export declare const isDevelopment: () => boolean;
//# sourceMappingURL=validation.d.ts.map