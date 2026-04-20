"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowIntent = parseWorkflowIntent;
async function parseWorkflowIntent(input) {
    const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
    });
    const data = await response.json();
    return {
        intent: data.intent,
        entities: data.entities,
        commands: data.commands,
        confidence: data.confidence
    };
}
//# sourceMappingURL=parseWorkflowIntent.js.map