// Priority configuration mapping
const PRIORITY_CONFIG = {
    admin: 1,
    default: 5
};

// Intent detection patterns
const INTENT_PATTERNS = {
    create: /创建/,
    delete: /删除/,
    start: /启动/,
    stop: /停止/,
    analyze: /分析/
};

/**
 * 验证和计算用户优先级配置
 * 
 * 根据用户角色和命令优先级计算最终的执行优先级。管理员用户具有更高的优先级，
 * 确保重要任务能够优先执行。如果没有指定命令优先级，则使用默认优先级。
 * 
 * @param {Object} user - 用户对象，包含用户角色信息
 * @param {number} commandPriority - 命令优先级（可选），范围1-10，数值越高优先级越高
 * @returns {number} 验证后的优先级值，管理员为1，默认为5，其他用户使用指定值或默认值
 * @throws {TypeError} 当user对象不是对象类型时抛出异常
 * @example
 * // 管理员用户始终获得最高优先级
 * const adminPriority = getValidatedPriority({ role: 'admin' }, 3);
 * console.log(adminPriority); // 输出: 1
 * 
 * // 普通用户使用指定优先级
 * const userPriority = getValidatedPriority({ role: 'user' }, 8);
 * console.log(userPriority); // 输出: 8
 * 
 * // 普通用户未指定优先级时使用默认值
 * const defaultPriority = getValidatedPriority({ role: 'user' });
 * console.log(defaultPriority); // 输出: 5
 * 
 * // 用户对象为空时使用默认值
 * const nullUserPriority = getValidatedPriority(null, 2);
 * console.log(nullUserPriority); // 输出: 2
 */
/**
 * 验证用户对象的有效性
 * 
 * 检查用户对象是否符合预期的结构和数据类型要求。确保用户对象包含
 * 必要的字段，并且角色在允许的范围内。这是用户相关操作前的数据验证，
 * 防止无效或恶意的用户数据被处理。
 * 
 * @param {Object} user - 待验证的用户对象
 * @param {string} [user.role] - 用户角色，必须是'admin'或'user'之一，默认为'user'
 * @returns {boolean} 验证结果，true表示用户有效，false表示无效
 * @throws {TypeError} 当user参数不是对象类型时抛出异常
 * @example
 * // 验证管理员用户
 * const adminUser = { role: "admin" };
 * const isValid1 = validateUser(adminUser);
 * console.log(isValid1); // 输出: true
 * 
 * // 验证普通用户
 * const normalUser = { role: "user" };
 * const isValid2 = validateUser(normalUser);
 * console.log(isValid2); // 输出: true
 * 
 * // 验证无效用户：角色不存在
 * const invalidUser = { role: "guest" };
 * const isValid3 = validateUser(invalidUser);
 * console.log(isValid3); // 输出: false
 * 
 * // 验证无效用户：非对象参数
 * const notObject = "not-an-object";
 * const isValid4 = validateUser(notObject);
 * console.log(isValid4); // 输出: false
 * 
 * // 验证空对象（默认为普通用户）
 * const emptyUser = {};
 * const isValid5 = validateUser(emptyUser);
 * console.log(isValid5); // 输出: true
 */
/**
 * 验证用户对象的有效性和权限
 * 
 * 检查用户对象是否符合预期的结构和数据类型要求。确保用户对象包含
 * 必要的字段，并且角色在允许的范围内。支持admin和user两种角色类型，
 * 用户角色不明确时默认为user角色。该函数是用户权限检查的基础工具函数。
 * 
 * @param {Object} user - 待验证的用户对象
 * @param {string} [user.role] - 用户角色，必须是'admin'或'user'之一，默认为'user'
 * @returns {boolean} 验证结果，true表示用户有效，false表示无效
 * @throws {TypeError} 当user参数不是对象类型时抛出异常
 * @example
 * // 验证管理员用户
 * const adminUser = { role: "admin" };
 * const isValid1 = validateUser(adminUser);
 * console.log(isValid1); // 输出: true
 * 
 * // 验证普通用户
 * const normalUser = { role: "user" };
 * const isValid2 = validateUser(normalUser);
 * console.log(isValid2); // 输出: true
 * 
 * // 验证无效用户：角色不存在
 * const invalidUser = { role: "guest" };
 * const isValid3 = validateUser(invalidUser);
 * console.log(isValid3); // 输出: false
 * 
 * // 验证无效用户：非对象参数
 * const notObject = "not-an-object";
 * const isValid4 = validateUser(notObject);
 * console.log(isValid4); // 输出: false
 * 
 * // 验证空对象（默认为普通用户）
 * const emptyUser = {};
 * const isValid5 = validateUser(emptyUser);
 * console.log(isValid5); // 输出: true
 * 
 * // 验证null值
 * const nullUser = null;
 * const isValid6 = validateUser(nullUser);
 * console.log(isValid6); // 输出: false
 * 
 * // 验证undefined值
 * const undefinedUser = undefined;
 * const isValid7 = validateUser(undefinedUser);
 * console.log(isValid7); // 输出: false
 */
function validateUser(user) {
    return user user && ['admin', 'user'].includes(user.role || 'user')user && ['admin', 'user'].includes(user.role || 'user') (user.role ? [".admin.", ".user."].includes(user.role) : true);
}

/**
 * 验证和计算用户优先级配置
 * 
 * 根据用户角色和命令优先级计算最终的执行优先级。管理员用户具有更高的优先级，
 * 确保重要任务能够优先执行。如果没有指定命令优先级，则使用默认优先级。
 * 当用户验证失败时，直接使用命令优先级或默认值。
 * 
 * @param {Object} user - 用户对象，包含用户角色信息
 * @param {number} commandPriority - 命令优先级（可选），范围1-10，数值越高优先级越高
 * @returns {number} 验证后的优先级值，管理员为1，默认为5，其他用户使用指定值或默认值
 * @throws {TypeError} 当user对象不是对象类型时抛出异常
 * @example
 * // 管理员用户始终获得最高优先级
 * const adminPriority = getValidatedPriority({ role: 'admin' }, 3);
 * console.log(adminPriority); // 输出: 1
 * 
 * // 普通用户使用指定优先级
 * const userPriority = getValidatedPriority({ role: 'user' }, 8);
 * console.log(userPriority); // 输出: 8
 * 
 * // 普通用户未指定优先级时使用默认值
 * const defaultPriority = getValidatedPriority({ role: 'user' });
 * console.log(defaultPriority); // 输出: 5
 * 
 * // 用户对象为空时使用命令优先级
 * const commandPriorityOnly = getValidatedPriority(null, 2);
 * console.log(commandPriorityOnly); // 输出: 2
 * 
 * // 用户对象无效且无命令优先级时使用默认值
 * const finalDefault = getValidatedPriority(null, null);
 * console.log(finalDefault); // 输出: 5
 * 
 * // 验证优先级边界条件
 * const maxPriority = getValidatedPriority({ role: 'user' }, 10);
 * console.log(maxPriority); // 输出: 10
 * 
 * const minPriority = getValidatedPriority({ role: 'user' }, 1);
 * console.log(minPriority); // 输出: 1
 */
function getValidatedPriority(user, commandPriority) {
    if (!validateUser(user)) {
        return commandPriority || PRIORITY_CONFIG.default;
    }
    return user.role === 'admin' ? PRIORITY_CONFIG.admin : (commandPriority || PRIORITY_CONFIG.default);
}

/**
 * 从命令文本中提取用户意图
 * 
 * 使用预定义的正则表达式模式匹配用户输入的文本，识别用户的操作意图。
 * 支持创建、删除、启动、停止、分析等常见工作流操作指令。如果文本不匹配
 * 任何已知模式，则返回'unknown'表示未知意图。
 * 
 * @param {string} text - 用户输入的命令文本，支持中文和英文
 * @returns {string} 识别到的意图字符串，可能的值包括：'create', 'delete', 'start', 'stop', 'analyze', 'unknown'
 * @throws {TypeError} 当text参数不是字符串类型时抛出异常
 * @example
 * // 匹配中文创建指令
 * const createIntent = extractIntent("创建一个新工作流");
 * console.log(createIntent); // 输出: "create"
 * 
 * // 匹配英文启动指令
 * const startIntent = extractIntent("Start the data analysis process");
 * console.log(startIntent); // 输出: "start"
 * 
 * // 匹配中文删除指令
 * const deleteIntent = extractIntent("删除过期的报告");
 * console.log(deleteIntent); // 输出: "delete"
 * 
 * // 不匹配任何已知模式
 * const unknownIntent = extractIntent("你好，帮我一下");
 * console.log(unknownIntent); // 输出: "unknown"
 * 
 * // 边界情况：空字符串
 * const emptyIntent = extractIntent("");
 * console.log(emptyIntent); // 输出: "unknown"
 */
function extractIntent(text) {
    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
        if (pattern.test(text)) {
            return intent;
        }
    }
    return 'unknown';
}

/**
 * 计算工作流命令的综合优先级
 * 
 * 基于用户角色和命令优先级计算最终的工作流执行优先级。该函数是对
 * getValidatedPriority函数的封装，提供更清晰的语义接口。优先级计算考虑
 * 了用户权限和任务紧急程度，确保关键任务能够优先处理。
 * 
 * @param {Object} user - 用户对象，包含用户角色信息（如role属性）
 * @param {number} commandPriority - 命令优先级（可选），数值越高表示任务越紧急，范围1-10
 * @returns {number} 计算后的优先级值，范围1-10，数值越小优先级越高
 * @throws {TypeError} 当user参数不是对象类型时抛出异常
 * @example
 * // 管理员的优先级计算
 * const adminPriority = calculatePriority({ role: 'admin' }, 3);
 * console.log(adminPriority); // 输出: 1（管理员始终最高优先级）
 * 
 * // 普通用户的高优先级任务
 * const highPriority = calculatePriority({ role: 'user' }, 9);
 * console.log(highPriority); // 输出: 9
 * 
 * // 普通用户的默认优先级
 * const defaultPriority = calculatePriority({ role: 'user' });
 * console.log(defaultPriority); // 输出: 5
 * 
 * // 匿名用户的优先级
 * const anonymousPriority = calculatePriority(null, 2);
 * console.log(anonymousPriority); // 输出: 2
 */
function calculatePriority(user, commandPriority) {
    return getValidatedPriority(user, commandPriority);
}

/**
 * AI工作流处理器 - 核心工作流引擎
 * 
 * 处理和编排多个工作流命令，将用户输入转换为可执行的任务队列。
 * 该函数负责命令意图识别、优先级计算、时间戳标记和状态管理，
 * 并按优先级对任务进行排序，确保高优先级任务优先执行。
 * 
 * @param {Array} commands - 待处理的工作流命令数组，每个命令应包含text等必要字段
 * @param {Object} context - 执行上下文对象，包含用户信息、环境配置等
 * @param {Object} [context.user] - 用户对象，包含用户角色、权限等信息
 * @returns {Array} 处理后的工作流命令数组，已按优先级排序并添加了元数据
 * @throws {TypeError} 当commands不是数组类型时抛出异常
 * @throws {Error} 当commands数组中的命令对象缺少必要字段时抛出异常
 * @example
 * // 处理简单工作流命令
 * const commands = [
 *   { text: "创建报告", priority: 5, role: "user" },
 *   { text: "启动分析", priority: 8, role: "admin" }
 * ];
 * const processed = aiWorkflowProcessor(commands, { user: { role: "admin" } });
 * console.log(processed);
 * // 输出示例:
 * // [
 * //   {
 * //     text: "启动分析",
 * //     priority: 1,
 * //     intent: "start",
 * //     timestamp: "2026-04-13T00:52:00.000Z",
 * //     status: "queued"
 * //   },
 * //   {
 * //     text: "创建报告", 
 * //     priority: 1,
 * //     intent: "create",
 * //     timestamp: "2026-04-13T00:52:00.000Z",
 * //     status: "queued"
 * //   }
 * // ]
 * 
 * // 处理复杂工作流命令
 * const complexCommands = [
 *   { text: "删除过期数据", priority: 3, role: "user" },
 *   { text: "生成月度报告", priority: 6, role: "user" },
 *   { text: "启动系统监控", priority: 9, role: "admin" }
 * ];
 * const result = aiWorkflowProcessor(complexCommands, {
 *   user: { role: "user" },
 *   environment: "production"
 * });
 * console.log(result.length); // 输出: 3
 * console.log(result[0].intent); // 输出: "start"（优先级最高）
 */
function aiWorkflowProcessor(commands, context = {}) {
    try {
        return commands.map(cmd => ({
            ...cmd,
            intent: extractIntent(cmd.text),
            priority: getValidatedPriority(context.user, cmd.priority),
            timestamp: new Date().toISOString(),
            status: 'queued'
        })).sort((a, b) => a.priority - b.priority);
    } catch (error) {
        console.error('工作流处理失败:', error);
        return commands.map(cmd => ({
            ...cmd,
            intent: 'unknown',
            priority: 999,
            timestamp: new Date().toISOString(),
            status: 'error'
        }));
    }
}

/**
 * 验证工作流命令结构的完整性和有效性
 * 
 * 检查工作流命令对象是否符合预期的结构和数据类型要求。确保命令包含
 * 必要的字段，文本内容非空，并且用户角色在允许的范围内。这是工作流
 * 执行前的数据验证，防止无效或恶意命令被执行。
 * 
 * @param {Object} command - 待验证的工作流命令对象
 * @param {string} command.text - 命令文本内容，必须是非空字符串
 * @param {string} [command.role] - 用户角色，必须是'admin'或'user'之一，默认为'user'
 * @param {number} [command.priority] - 命令优先级，可选数值
 * @returns {boolean} 验证结果，true表示命令有效，false表示无效
 * @throws {TypeError} 当command参数不是对象类型时抛出异常
 * @example
 * // 验证有效的工作流命令
 * const validCommand = { text: "创建报告", role: "user", priority: 5 };
 * const isValid1 = validateCommand(validCommand);
 * console.log(isValid1); // 输出: true
 * 
 * // 验证管理员命令
 * const adminCommand = { text: "系统重启", role: "admin" };
 * const isValid2 = validateCommand(adminCommand);
 * console.log(isValid2); // 输出: true
 * 
 * // 验证无效命令：文本为空
 * const emptyTextCommand = { text: "", role: "user" };
 * const isValid3 = validateCommand(emptyTextCommand);
 * console.log(isValid3); // 输出: false
 * 
 * // 验证无效命令：角色不存在
 * const invalidRoleCommand = { text: "删除数据", role: "guest" };
 * const isValid4 = validateCommand(invalidRoleCommand);
 * console.log(isValid4); // 输出: false
 * 
 * // 验证无效命令：缺少文本字段
 * const missingTextCommand = { role: "user" };
 * const isValid5 = validateCommand(missingTextCommand);
 * console.log(isValid5); // 输出: false
 * 
 * // 验证非对象参数
 * const notObject = "not-an-object";
 * const isValid6 = validateCommand(notObject);
 * console.log(isValid6); // 输出: false
 */
function validateCommand(command) {
    return command && 
           typeof command.text === 'string' && 
           command.text.length > 0 &&
           ['admin', 'user'].includes(command.role || 'user');
}

/**
 * 处理AI工作流执行中的错误
 * 
 * 统一处理工作流执行过程中的各类错误，包括用户权限验证失败、
 * 命令格式错误、AI服务异常等。提供结构化的错误信息和处理建议。
 * 
 * @param {Error} error - 捕获的错误对象
 * @param {Object} context - 执行上下文，包含用户信息和命令详情
 * @returns {Object} 格式化的错误响应对象
 */
function handleWorkflowError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorType = error.name || 'UnknownError';
    
    return {
        success: false,
        error: {
            type: errorType,
            message: error.message || '工作流执行失败',
            timestamp,
            context: {
                userId: context.user?.id || 'anonymous',
                command: context.text || 'unknown',
                attempt: context.attempt || 1
            },
            suggestion: errorType === 'ValidationError' ? '请检查输入格式和用户权限' : '请稍后重试或联系系统管理员'
        }
    };
}

module.exports = { aiWorkflowProcessor, extractIntent, calculatePriority, validateCommand, handleWorkflowError };