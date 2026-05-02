"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflow_id_generator_1 = require("./workflow-id-generator");
describe('workflow-id-generator', () => {
    describe('generateWorkflowId', () => {
        test('should generate workflow ID with name and timestamp', () => {
            const id = (0, workflow_id_generator_1.generateWorkflowId)('test-workflow');
            expect(id).toMatch(/^testworkflow-[a-z0-9]+$/);
            expect(id.length).toBeGreaterThan(12);
        });
        test('should clean and limit name to 8 characters', () => {
            const longName = 'this-is-a-very-long-workflow-name';
            const id = (0, workflow_id_generator_1.generateWorkflowId)(longName);
            expect(id).toMatch(/^thisisav-[a-z0-9]+$/);
            expect(id.split('-')[0]).toBe('thisisav');
        });
        test('should remove special characters from name', () => {
            const nameWithSpecialChars = 'workflow_$test#@';
            const id = (0, workflow_id_generator_1.generateWorkflowId)(nameWithSpecialChars);
            expect(id).toMatch(/^workflowtest-[a-z0-9]+$/);
            expect(id.split('-')[0]).toBe('workflowtest');
        });
        test('should handle empty string name', () => {
            const id = (0, workflow_id_generator_1.generateWorkflowId)('');
            expect(id).toMatch(/^[a-z0-9]+$/);
            expect(id.length).toBeGreaterThan(0);
        });
        test('should generate different IDs for different names', () => {
            const id1 = (0, workflow_id_generator_1.generateWorkflowId)('workflow1');
            const id2 = (0, workflow_id_generator_1.generateWorkflowId)('workflow2');
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^workflow1-[a-z0-9]+$/);
            expect(id2).toMatch(/^workflow2-[a-z0-9]+$/);
            expect(id1.split('-')[0]).toBe('workflow1');
            expect(id2.split('-')[0]).toBe('workflow2');
        });
        test('should handle names shorter than 8 characters', () => {
            const shortName = 'short';
            const id = (0, workflow_id_generator_1.generateWorkflowId)(shortName);
            expect(id).toMatch(/^short-[a-z0-9]+$/);
            expect(id.split('-')[0]).toBe('short');
        });
        test('should handle names with numbers', () => {
            const nameWithNumbers = 'workflow123';
            const id = (0, workflow_id_generator_1.generateWorkflowId)(nameWithNumbers);
            expect(id).toMatch(/^workflow123-[a-z0-9]+$/);
            expect(id.split('-')[0]).toBe('workflow123');
        });
    });
});
//# sourceMappingURL=workflow-id-generator.test.js.map