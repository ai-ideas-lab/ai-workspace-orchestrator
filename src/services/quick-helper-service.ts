export const getQuickStatus = () => {
  try {
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: "error", 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
