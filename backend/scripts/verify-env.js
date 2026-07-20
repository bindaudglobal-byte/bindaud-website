require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const required = [
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'JWT_SECRET'
];

const smtpPresent = process.env.EMAIL_HOST || process.env.SMTP_HOST;

console.log('Environment verification:');
required.forEach((k) => console.log(`${k}:`, !!process.env[k]));
console.log('SMTP configured:', !!(process.env.EMAIL_USER || process.env.SMTP_USER));
console.log('Email from:', process.env.EMAIL_FROM || 'not set');
console.log('Mongo URI:', !!process.env.MONGODB_URI);

if (!smtpPresent) console.warn('Warning: SMTP/EMAIL host not configured. Emails will be skipped.');

process.exit(0);
