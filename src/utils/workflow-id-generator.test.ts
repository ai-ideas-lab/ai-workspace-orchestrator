import { generateWorkflowId } from './workflow-id-generator';

describe('workflow-id-generator', () => {
  describe('generateWorkflowId', () => {
    test('should generate unique workflow ID with name and timestamp', () => {
      const id1 = generateWorkflowId('test-workflow');
      const id2 = generateWorkflowId('test-workflow');
      
      // Should be different due to timestamp
      expect(id1).not.toBe(id2);
      
      // Should follow format: cleanName-timestamp
      expect(id1).toMatch(/^testworkflow-[a-z0-9]+$/);
      expect(id2).toMatch(/^testworkflow-[a-z0-9]+$/);
    });

    test('should clean and limit name to 8 characters', () => {
      const longName = 'this-is-a-very-long-workflow-name';
      const id = generateWorkflowId(longName);
      
      // Should be limited to 8 characters after cleaning
      expect(id).toMatch(/^thisisav-[a-z0-9]+$/);
    });

    test('should remove special characters from name', () => {
      const nameWithSpecialChars = 'workflow_$test#@';
      const id = generateWorkflowId(nameWithSpecialChars);
      
      // Should only contain alphanumeric characters
      expect(id).toMatch(/^workflowtest-[a-z0-9]+$/);
    });

    test('should handle empty string name', () => {
      const id = generateWorkflowId('');
      
      // Should still generate timestamp-based ID
      expect(id).toMatch(/^[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(0);
    });

    test('should generate different IDs for different names', () => {
      const id1 = generateWorkflowId('workflow1');
      const id2 = generateWorkflowId('workflow2');
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^workflow1-[a-z0-9]+$/);
      expect(id2).toMatch(/^workflow2-[a-z0-9]+$/);
    });
  });
});