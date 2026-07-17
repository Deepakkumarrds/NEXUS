require('dotenv').config();
const emailService = require('./services/emailService');

(async () => {
  console.log("Testing email to user: gowtham.kt@rdsdigital.in");
  const success = await emailService.sendPasswordResetEmail("gowtham.kt@rdsdigital.in", "http://localhost:3000/reset");
  console.log("Email sent success?", success);
  process.exit(0);
})();
