const _ = require('lodash');
const { formatDate, isValidEmail } = require('../../shared/src/utils');

// Utility function to debounce a function
function debounce(func, wait = 500) {
  return _.debounce(func, wait);
}

// Utility function to throttle a function
function throttle(func, limit = 1000) {
  return _.throttle(func, limit);
}

module.exports = {
  formatDate,
  debounce,
  throttle,
  isValidEmail
};