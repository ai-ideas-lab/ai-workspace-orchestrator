"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironmentVariables = validateEnvironmentVariables;
exports.validateDatabaseEnvironment = validateDatabaseEnvironment;
exports.validateAIEnvironment = validateAIEnvironment;
function validateEnvironmentVariables() {
    const requiredVars = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
    const errors = [];
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            errors.push(`${varName} is required`);
        }
    }
    return errors;
}
function validateDatabaseEnvironment() {
    const dbRequiredVars = [
        'DATABASE_URL',
        'DATABASE_USERNAME',
        'DATABASE_PASSWORD'
    ];
    const errors = [];
    for (const varName of dbRequiredVars) {
        if (!process.env[varName]) {
            errors.push(`${varName} is required for database connection`);
        }
    }
    return errors;
}
function validateAIEnvironment() {
    const aiRequiredVars = [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'AI_MODEL_TYPE'
    ];
    const errors = [];
    for (const varName of aiRequiredVars) {
        if (!process.env[varName]) {
            const serviceName = varName.split('_')[0];
            errors.push(`${serviceName} service may not be available - ${varName} is missing`);
        }
    }
    return errors;
}
//# sourceMappingURL=environment-validator.js.map