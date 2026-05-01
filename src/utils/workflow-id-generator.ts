export function generateWorkflowId(name: string): string {
  const timestamp = Date.now().toString(36);
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `${cleanName}-${timestamp}`;
}