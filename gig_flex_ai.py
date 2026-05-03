def predict_gig_income(hours_worked, platform_rate, efficiency_factor=1.0):
    """预测零工工作者收入"""
    return hours_worked * platform_rate * efficiency_factor
