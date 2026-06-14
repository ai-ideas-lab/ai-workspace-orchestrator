module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/runtime/**/*.test.ts',
    '**/__tests__/workflow-executor.test.ts',
    '**/__tests__/workflow-scheduler.test.ts',
    '**/__tests__/workflow-dependency-analyzer.test.ts',
    '**/__tests__/workflow-version.test.ts',
    '**/__tests__/load-balancer-simple.test.ts',
    '**/__tests__/metrics-collector.test.ts',
    '**/__tests__/health-check.test.ts',
    '**/__tests__/notification-service.test.ts',
    '**/__tests__/user-auth.test.ts',
    '**/utils/__tests__/quick-numeric-validator.test.ts'
  ],
  collectCoverageFrom: [
    'src/app.ts',
    'src/routes/workflows.ts',
    'src/services/workflow-executor.ts',
    'src/services/workflow-scheduler.ts',
    'src/services/workflow-store.ts',
    'src/services/workflow-dependency-analyzer.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000
};
