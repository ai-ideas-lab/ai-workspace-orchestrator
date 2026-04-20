"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
exports.validateStep = validateStep;
exports.validateConfigWithReport = validateConfigWithReport;
function validateConfig(cfg) {
    const errors = [];
    if (!cfg.name || typeof cfg.name !== 'string' || cfg.name.trim().length === 0) {
        errors.push('name must be a non-empty string');
    }
    if (!Array.isArray(cfg.steps) || cfg.steps.length === 0) {
        errors.push('steps must be a non-empty array');
    }
    else {
        cfg.steps.forEach((step, index) => {
            const stepErrors = validateStep(step, index);
            errors.push(...stepErrors);
        });
    }
    if (cfg.timeout !== undefined && (typeof cfg.timeout !== 'number' || cfg.timeout <= 0)) {
        errors.push('timeout must be a positive number');
    }
    if (cfg.retryLimit !== undefined && (typeof cfg.retryLimit !== 'number' || cfg.retryLimit < 0 || cfg.retryLimit > 10)) {
        errors.push('retryLimit must be between 0 and 10');
    }
    if (cfg.environment !== undefined && (typeof cfg.environment !== 'string' || !['development', 'staging', 'production'].includes(cfg.environment))) {
        errors.push('environment must be one of: development, staging, production');
    }
    return errors;
}
function validateStep(step, index) {
    const errors = [];
    if (!step || typeof step !== 'object') {
        errors.push(`step ${index}: must be an object`);
        return errors;
    }
    const stepObj = step;
    if (!stepObj.id || typeof stepObj.id !== 'string' || stepObj.id.trim().length === 0) {
        errors.push(`step ${index}: id must be a non-empty string`);
    }
    if (!stepObj.name || typeof stepObj.name !== 'string' || stepObj.name.trim().length === 0) {
        errors.push(`step ${index}: name must be a non-empty string`);
    }
    if (!stepObj.taskType || typeof stepObj.taskType !== 'string' || stepObj.taskType.trim().length === 0) {
        errors.push(`step ${index}: taskType must be a non-empty string`);
    }
    if (stepObj.payload !== undefined && typeof stepObj.payload !== 'object') {
        errors.push(`step ${index}: payload must be an object`);
    }
    if (stepObj.dependsOn !== undefined && !Array.isArray(stepObj.dependsOn)) {
        errors.push(`step ${index}: dependsOn must be an array`);
    }
    return errors;
}
function validateConfigWithReport(cfg) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    if (!cfg.name || typeof cfg.name !== 'string' || cfg.name.trim().length === 0) {
        errors.push('name must be a non-empty string');
    }
    else if (cfg.name.length > 50) {
        warnings.push('name should be concise (max 50 characters)');
    }
    if (cfg.steps && Array.isArray(cfg.steps)) {
        if (cfg.steps.length > 20) {
            warnings.push('workflow has many steps, consider breaking it into sub-workflows');
        }
        if (cfg.steps.length < 3 && cfg.steps.length > 0) {
            suggestions.push('consider adding more detailed steps for better error handling');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
    };
}
//# sourceMappingURL=config-validator.js.map