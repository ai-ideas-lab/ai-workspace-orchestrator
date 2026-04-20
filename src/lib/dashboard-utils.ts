export const initializeDashboardData = async (userId: string) => {
  const [workflows, user, alerts] = await Promise.all([
    prisma.workflow.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dashboardAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  ]);
  
  return {
    workflows,
    user: { ...user, password: undefined },
    alerts,
    summary: {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'running').length,
      completedWorkflows: workflows.filter(w => w.status === 'completed').length
    }
  };
};