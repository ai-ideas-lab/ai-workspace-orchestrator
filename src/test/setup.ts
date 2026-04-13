// Test setup file
import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);