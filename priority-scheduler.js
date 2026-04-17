async function schedulePriorityWorkflow(workflows) {
  const sorted = workflows.sort((a, b) => b.priority - a.priority);
  const now = Date.now();
  return sorted.filter(w => w.due >= now).slice(0, 3);
}