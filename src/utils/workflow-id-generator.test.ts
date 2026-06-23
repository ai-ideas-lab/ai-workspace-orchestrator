import { generateWorkflowId } from './workflow-id-generator';

describe('workflow-id-generator', () => {
  describe('generateWorkflowId', () => {
    test('should generate workflow ID with name and timestamp', () => {
      const id = generateWorkflowId('test-workflow');
      
      // Should follow format: cleanName-timestamp
      expect(id).toMatch(/^testworkflow-[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(12); // 8 chars + hyphen + timestamp
    });

    test('should clean and limit name to 8 characters', () => {
      const longName = 'this-is-a-very-long-workflow-name';
      const id = generateWorkflowId(longName);
      
      // Should be limited to 8 characters after cleaning
      expect(id).toMatch(/^thisisav-[a-z0-9]+$/);
      expect(id.split('-')[0]).toBe('thisisav');
    });

    test('should remove special characters from name', () => {
      const nameWithSpecialChars = 'workflow_$test#@';
      const id = generateWorkflowId(nameWithSpecialChars);
      
      // Should only contain alphanumeric characters in the name part
      expect(id).toMatch(/^workflowtest-[a-z0-9]+$/);
      expect(id.split('-')[0]).toBe('workflowtest');
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
      expect(id1.split('-')[0]).toBe('workflow1');
      expect(id2.split('-')[0]).toBe('workflow2');
    });

    test('should handle names shorter than 8 characters', () => {
      const shortName = 'short';
      const id = generateWorkflowId(shortName);
      
      expect(id).toMatch(/^short-[a-z0-9]+$/);
      expect(id.split('-')[0]).toBe('short');
    });

    test('should handle names with numbers', () => {
      const nameWithNumbers = 'workflow123';
      const id = generateWorkflowId(nameWithNumbers);
      
      expect(id).toMatch(/^workflow123-[a-z0-9]+$/);
      expect(id.split('-')[0]).toBe('workflow123');
    });
  });
});