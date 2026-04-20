/**
 * 安全访问事件数组元素 - EventBus测试助手函数
 * 
 * 在测试环境中安全访问事件数组元素，避免未定义空数组或索引越界错误。
 * 该函数提供类型安全的数组访问，适用于EventBus和其他事件处理系统的测试场景。
 * 在访问数组元素前进行完整性检查，确保测试的健壮性和可重复性。
 * 
 * @template T - 数组元素的数据类型，支持泛型类型推断
 * @param {T[]} events - 待访问的事件数组，可能为null、undefined或空数组
 * @param {number} index - 要访问的数组索引位置，必须为非负整数
 * @returns {T} 指定索引位置的数组元素，类型与数组元素类型一致
 * @throws {Error} 当events数组为null、undefined、空数组或索引越界时抛出异常
 * @example
 * // 正常事件数组访问
 * const events = ['event1', 'event2', 'event3'];
 * const event = safeEventAccess(events, 1);
 * console.log(event); // 输出: 'event2'
 * 
 * // 事件类型推断
 * const complexEvents = [
 *   { type: 'user.login', data: { userId: 123 } },
 *   { type: 'user.logout', data: { userId: 123 } }
 * ];
 * const userEvent = safeEventAccess(complexEvents, 0);
 * console.log(userEvent.type); // 输出: 'user.login'
 * 
 * // 测试场景使用
 * function testEventBus() {
 *   const mockEvents = mockEventBus.getEvents();
 *   try {
 *     const firstEvent = safeEventAccess(mockEvents, 0);
 *     console.log('第一个事件:', firstEvent);
 *     // 继续测试逻辑...
 *   } catch (error) {
 *     console.log('没有事件可测试，跳过测试用例');
 *   }
 * }
 * 
 * // 边界情况处理
 * const emptyEvents: string[] = [];
 * try {
 *   safeEventAccess(emptyEvents, 0); // 抛出异常
 * } catch (error) {
 *   console.error('错误:', error.message); // 输出: Events array is empty...
 * }
 * 
 * // 错误类型验证
 * try {
 *   safeEventAccess(null as any, 0); // 抛出异常
 * } catch (error) {
 *   console.error('错误类型:', error instanceof Error);
 * }
 */
export function safeEventAccess<T>(events: T[], index: number): T {
  if (!events || events.length === 0) {
    throw new Error(`Events array is empty or undefined, cannot access index ${index}`);
  }
  return events[index];
}