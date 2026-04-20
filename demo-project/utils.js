const _ = require('lodash');

// Import shared utilities
const { formatDate, isValidEmail } = require('../shared/src/utils');

// Additional utility functions specific to demo project

// Function to generate a unique ID
function generateUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to capitalize a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  formatDate,
  isValidEmail,
  generateUniqueId,
  capitalize
};