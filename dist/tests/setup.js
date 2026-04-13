"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = void 0;
const globals_1 = require("@jest/globals");
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
globals_1.jest.mock('../database/index', () => ({
    prisma: {
        user: {
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
        },
        workflow: {
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
        },
        workflowExecution: {
            create: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
        $connect: globals_1.jest.fn(),
        $disconnect: globals_1.jest.fn(),
        $transaction: globals_1.jest.fn(),
    }
}));
globals_1.jest.mock('../services/event-bus.ts', () => ({
    EventBus: globals_1.jest.fn().mockImplementation(() => ({
        emit: globals_1.jest.fn(),
        on: globals_1.jest.fn(),
        off: globals_1.jest.fn(),
        once: globals_1.jest.fn(),
        removeAllListeners: globals_1.jest.fn(),
        shutdown: globals_1.jest.fn(),
    }))
}));
globals_1.jest.mock('../utils/logger.ts', () => ({
    logger: {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn(),
        verbose: globals_1.jest.fn(),
    }
}));
exports.TestUtils = {
    createUser: (overrides = {}) => ({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }),
    createWorkflow: (overrides = {}) => ({
        id: 'workflow-123',
        name: 'Test Workflow',
        description: 'Test workflow description',
        config: { steps: [] },
        status: 'ACTIVE',
        variables: {},
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }),
    createExecution: (overrides = {}) => ({
        id: 'execution-123',
        workflowId: 'workflow-123',
        status: 'PENDING',
        inputVariables: {},
        outputVariables: {},
        startTime: new Date(),
        endTime: null,
        duration: null,
        ...overrides,
    }),
    createMockRequest: (overrides = {}) => ({
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        path: '/test',
        params: {},
        query: {},
        body: {},
        headers: {
            'content-type': 'application/json',
            'user-agent': 'test-agent',
        },
        ip: '127.0.0.1',
        get: globals_1.jest.fn((header) => {
            const headers = {
                'content-type': 'application/json',
                'user-agent': 'test-agent',
                'authorization': 'Bearer token',
            };
            return headers[header] || '';
        }),
        ...overrides,
    }),
    createMockResponse: (overrides = {}) => {
        const response = {
            statusCode: 200,
            locals: {},
            headers: {},
            getHeader: globals_1.jest.fn(() => null),
            setHeader: globals_1.jest.fn(),
            status: globals_1.jest.fn(function (code) {
                this.statusCode = code;
                return this;
            }),
            json: globals_1.jest.fn(),
            send: globals_1.jest.fn(),
            end: globals_1.jest.fn(),
            ...overrides,
        };
        return response;
    },
    createMockNext = () => globals_1.jest.fn(),
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    generateTestUuid: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
    createDatabaseError: (code, meta = {}) => ({
        code,
        meta,
        message: `Database error with code ${code}`,
        stack: 'Error: Database error\n    at test',
    }),
    createAsyncFunction: (shouldFail = false, delay = 100) => async (...args) => {
        await exports.TestUtils.wait(delay);
        if (shouldFail) {
            throw new Error('Async function failed');
        }
        return { success: true, args };
    },
};
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
afterEach(() => {
    globals_1.jest.useFakeTimers().clearAllTimers();
});
globals_1.jest.setTimeout(30000);
expect.extend({
    toHaveStatusCode(received, expected) {
        const pass = received.statusCode === expected;
        return {
            pass,
            message: () => `Expected status code ${received.statusCode} to be ${expected}`,
        };
    },
    toHaveErrorCode(received, expected) {
        const pass = received.body?.error?.code === expected;
        return {
            pass,
            message: () => `Expected error code ${received.body?.error?.code} to be ${expected}`,
        };
    },
    toHaveUserMessage(received, expected) {
        const pass = received.body?.error?.message === expected;
        return {
            pass,
            message: () => `Expected user message ${received.body?.error?.message} to be ${expected}`,
        };
    },
    toBeOperationalError(received) {
        const pass = received.body?.error?.isOperational === true;
        return {
            pass,
            message: () => `Expected error to be operational`,
        };
    },
    toBeSystemError(received) {
        const pass = received.body?.error?.isOperational === false;
        return {
            pass,
            message: () => `Expected error to be system error`,
        };
    },
});
//# sourceMappingURL=setup.js.map