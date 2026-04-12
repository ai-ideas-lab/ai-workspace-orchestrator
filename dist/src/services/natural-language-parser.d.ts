import { z } from 'zod';
declare const CommandTypeSchema: z.ZodEnum<["create_meeting", "schedule_task", "analyze_data", "generate_report", "send_email", "make_phone_call", "search_web", "create_document", "schedule_reminder", "start_workflow"]>;
declare const CommandSchema: z.ZodObject<{
    type: z.ZodEnum<["create_meeting", "schedule_task", "analyze_data", "generate_report", "send_email", "make_phone_call", "search_web", "create_document", "schedule_reminder", "start_workflow"]>;
    parameters: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    confidence: z.ZodNumber;
    originalText: z.ZodString;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "create_meeting" | "schedule_task" | "analyze_data" | "generate_report" | "send_email" | "make_phone_call" | "search_web" | "create_document" | "schedule_reminder" | "start_workflow";
    timestamp: string;
    parameters: {} & {
        [k: string]: unknown;
    };
    confidence: number;
    originalText: string;
}, {
    type: "create_meeting" | "schedule_task" | "analyze_data" | "generate_report" | "send_email" | "make_phone_call" | "search_web" | "create_document" | "schedule_reminder" | "start_workflow";
    timestamp: string;
    parameters: {} & {
        [k: string]: unknown;
    };
    confidence: number;
    originalText: string;
}>;
export type CommandType = z.infer<typeof CommandTypeSchema>;
export type Command = z.infer<typeof CommandSchema>;
export declare class NaturalLanguageParser {
    private commandPatterns;
    constructor();
    private initializePatterns;
    parseCommand(text: string): Promise<Command>;
    private extractParameters;
    addCommandPattern(type: CommandType, pattern: RegExp): void;
    getAvailableCommands(): CommandType[];
}
export {};
//# sourceMappingURL=natural-language-parser.d.ts.map