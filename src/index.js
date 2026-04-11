const { formatDate, isValidEmail } = require('./utils/common');

console.log('=== Main Project ===');

const today = new Date();
console.log('Today is:', formatDate(today));

const testEmail = 'test@example.com';
console.log('Is email valid:', testEmail, isValidEmail(testEmail));

const invalidEmail = 'invalid-email';
console.log('Is email valid:', invalidEmail, isValidEmail(invalidEmail));