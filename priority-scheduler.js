function schedulePriorityWorkflow(workflows) {
  const now = Date.now();
  return workflows
    .sort((a, b) => b.priority - a.priority)
    .filter(w => w.due >= now)
    .slice(0, 3);
}