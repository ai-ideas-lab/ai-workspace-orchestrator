function schedulePriorityWorkflow(workflows) {
  const now = Date.now();
  return workflows
    .filter(w => w.due >= now)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

function calculatePriorityScore(workflow) {
  const now = Date.now();
  const timeUrgency = Math.max(0, (workflow.due - now) / (24 * 60 * 60 * 1000));
  return workflow.priority * (1 + Math.max(0, 10 - timeUrgency) / 10);
}