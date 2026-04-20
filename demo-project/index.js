const { formatDate, isValidEmail, generateUniqueId } = require('./utils');

console.log('=== Demo Project ===');

const today = new Date();
console.log('Today is:', formatDate(today));

const testEmail = 'demo@example.com';
console.log('Is email valid:', testEmail, isValidEmail(testEmail));

const id = generateUniqueId('demo');
console.log('Generated ID:', id);

const invalidEmail = 'invalid-demo-email';
console.log('Is email valid:', invalidEmail, isValidEmail(invalidEmail));