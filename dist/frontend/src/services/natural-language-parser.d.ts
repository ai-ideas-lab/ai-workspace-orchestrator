export interface ParseResult {
    intent: string;
    confidence: number;
    entities: string[];
    suggestedActions: string[];
}
export declare class NaturalLanguageParser {
    parseCommand(command: string): Promise<ParseResult>;
    private analyzeIntent;
    private extractEntities;
    private generateSuggestedActions;
    private calculateConfidence;
}
export declare const naturalLanguageParser: NaturalLanguageParser;
//# sourceMappingURL=natural-language-parser.d.ts.map