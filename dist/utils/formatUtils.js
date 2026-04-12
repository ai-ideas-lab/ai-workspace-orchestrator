import moment from 'moment';
export const formatDate = (dateString) => {
    try {
        const date = moment(dateString);
        if (date.isSame(new Date(), 'day')) {
            return date.format('HH:mm:ss');
        }
        if (date.isSame(new Date(), 'year')) {
            return date.format('MM-DD HH:mm');
        }
        return date.format('YYYY-MM-DD HH:mm');
    }
    catch (error) {
        console.error('日期格式化错误:', error);
        return dateString;
    }
};
export const formatDuration = (seconds) => {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}m`;
};
export const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export const formatNumber = (num) => {
    return num.toLocaleString('zh-CN');
};
export const formatPercentage = (value, precision = 1) => {
    return `${(value * 100).toFixed(precision)}%`;
};
export const formatCurrency = (amount, currency = '$') => {
    return `${currency}${amount.toFixed(2)}`;
};
//# sourceMappingURL=formatUtils.js.map