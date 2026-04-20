"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
process.env.NODE_ENV = 'test';
global.console = {
    ...console,
    log: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
};
globals_1.jest.setTimeout(10000);
//# sourceMappingURL=setup.js.map