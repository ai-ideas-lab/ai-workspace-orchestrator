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

module.exports = {
  formatDate,
  isValidEmail
};