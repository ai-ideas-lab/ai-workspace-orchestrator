// Local implementations to avoid missing dependencies
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Utility function to debounce a function (simplified version)
function debounce(func, wait = 500) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility function to throttle a function (simplified version)
function throttle(func, limit = 1000) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Utility function to generate a simple unique ID
function generateSimpleId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

// Utility function to validate URL format
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  formatDate,
  debounce,
  throttle,
  isValidEmail,
  generateSimpleId,
  isValidUrl
};