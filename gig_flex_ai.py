def predict_gig_income(hours_worked, platform_rate, efficiency_factor=1.0):
    """预测零工工作者收入"""
    return hours_worked * platform_rate * efficiency_factor

def explain_income_calculation(hours, rate, efficiency):
    """算法透明化：展示收入计算明细"""
    base = hours * rate
    bonus = base * (efficiency - 1) if efficiency > 1 else 0
    total = base + bonus
    return f"基础收入: ¥{base:.2f}, 效率奖励: ¥{bonus:.2f}, 总计: ¥{total:.2f}"
