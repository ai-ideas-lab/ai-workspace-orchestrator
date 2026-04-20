/**
 * Parse natural language intent and extract workflow commands
 * @param input User's natural language command
 * @returns Parsed workflow commands and entities
 */
export async function parseWorkflowIntent(input: string) {
  const response = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input })
  });
  
  const data = await response.json();
  return {
    intent: data.intent,
    entities: data.entities,
    commands: data.commands,
    confidence: data.confidence
  };
}