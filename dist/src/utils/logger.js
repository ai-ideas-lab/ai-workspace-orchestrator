import { createLogger, format, transports } from 'winston';
const { combine, timestamp, errors, json, printf } = format;
const customFormat = printf(({ level, message, timestamp, ...meta }) => {
    const logMessage = meta.error
        ? `${timestamp} [${level}] ${message} - Error: ${meta.error.message}`
        : `${timestamp} [${level}] ${message}`;
    if (Object.keys(meta).length > 0 && !meta.error) {
        return `${logMessage} - Meta: ${JSON.stringify(meta)}`;
    }
    return logMessage;
});
export const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), errors({ stack: true }), process.env.NODE_ENV === 'development'
        ? format.simple()
        : format.json()),
    transports: [
        new transports.Console({
            format: process.env.NODE_ENV === 'development'
                ? combine(timestamp(), format.colorize(), customFormat)
                : combine(timestamp(), format.json())
        }),
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(timestamp(), format.json())
        }),
        new transports.File({
            filename: 'logs/combined.log',
            format: combine(timestamp(), format.json())
        })
    ]
});
export function createModuleLogger(module) {
    return createLogger({
        ...logger.transports,
        defaultMeta: { module }
    });
}
//# sourceMappingURL=logger.js.map