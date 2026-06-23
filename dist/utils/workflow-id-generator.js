"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkflowId = generateWorkflowId;
function generateWorkflowId(name) {
    const timestamp = Date.now().toString(36);
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return `${cleanName}-${timestamp}`;
}
//# sourceMappingURL=workflow-id-generator.js.map