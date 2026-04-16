export function parseWorkflowCommand(input: string): {
  intent: string;
  entities: string[];
  steps: string[];
} {
  const entities = input.match(/\b(?:create|run|schedule|analyze)\b/g) || [];
  const steps = input.split(/[\s,;]+/).filter(word => word.length > 2);
  return {
    intent: entities[0] || 'unknown',
    entities,
    steps
  };
}