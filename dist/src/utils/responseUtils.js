export const successResponse = (res, data, message, status = 200) => {
    return res.status(status).json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    });
};
export const errorResponse = (res, error, details, status = 500) => {
    return res.status(status).json({
        success: false,
        error,
        details,
        timestamp: new Date().toISOString(),
    });
};
export const validationErrorResponse = (res, details) => {
    return res.status(400).json({
        success: false,
        error: '参数验证失败',
        details,
        timestamp: new Date().toISOString(),
    });
};
export const authErrorResponse = (res, error) => {
    return res.status(401).json({
        success: false,
        error,
        timestamp: new Date().toISOString(),
    });
};
export const conflictErrorResponse = (res, error) => {
    return res.status(409).json({
        success: false,
        error,
        timestamp: new Date().toISOString(),
    });
};
//# sourceMappingURL=responseUtils.js.map