const _ = require('lodash');
const moment = require('moment');

// Utility function to format a date
function formatDate(date, format = 'YYYY-MM-DD') {
  return moment(date).format(format);
}

// Function to validate an email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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