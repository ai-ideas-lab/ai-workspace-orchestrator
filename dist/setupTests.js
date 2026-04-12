import { jest } from '@jest/globals';
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
//# sourceMappingURL=setupTests.js.map