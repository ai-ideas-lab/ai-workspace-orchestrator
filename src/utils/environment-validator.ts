/**
 * Utility function to validate environment variables
 * Validates required environment variables for the application
 */
export function validateEnvironmentVariables(): string[] {
  const requiredVars = ["NODE_ENV", "PORT", "JWT_SECRET"];
  const requiredVars = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
  const errors: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`${varName} is required`);
    }
  }
  
  return errors;
}
}
