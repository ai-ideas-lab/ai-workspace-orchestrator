export const getQuickStatus = () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
};