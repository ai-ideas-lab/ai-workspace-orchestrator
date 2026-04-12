"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/ai-workspace-orchestrator_test';
jest.setTimeout(30000);
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
//# sourceMappingURL=test-setup.js.map