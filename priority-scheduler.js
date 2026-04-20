function schedulePriorityWorkflow(workflows) {
  const now = Date.now();
  return workflows
    .filter(w => w.due >= now)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

function calculatePriorityScore(workflow, now = Date.now()) {
  const overdueDays = Math.max(0, (workflow.due - now) / (24 * 60 * 60 * 1000));
  const urgencyBonus = Math.max(0, 10 - overdueDays) / 10;
  return workflow.priority * (1 + urgencyBonus);
}