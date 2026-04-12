const { formatDate, isValidEmail, generateSimpleId, isValidUrl } = require('./utils/common');

console.log('=== Main Project ===');

const today = new Date();
console.log('Today is:', formatDate(today));

const testEmail = 'test@example.com';
console.log('Is email valid:', testEmail, isValidEmail(testEmail));

const invalidEmail = 'invalid-email';
console.log('Is email valid:', invalidEmail, isValidEmail(invalidEmail));

// Test new utility functions
console.log('\n=== New Utility Functions ===');

const generatedId = generateSimpleId();
console.log('Generated ID:', generatedId);

const longerId = generateSimpleId(12);
console.log('Generated longer ID:', longerId);

const validUrl = 'https://example.com';
console.log('Is URL valid:', validUrl, isValidUrl(validUrl));

const invalidUrl = 'not-a-url';
console.log('Is URL valid:', invalidUrl, isValidUrl(invalidUrl));