"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowCommand = parseWorkflowCommand;
function parseWorkflowCommand(input) {
    const entities = input.match(/\b(?:create|run|schedule|analyze)\b/g) || [];
    const steps = input.split(/[\s,;]+/).filter(word => word.length > 2);
    return {
        intent: entities[0] || 'unknown',
        entities,
        steps
    };
}
//# sourceMappingURL=parseWorkflowCommand.js.map