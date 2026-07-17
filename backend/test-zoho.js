const nodemailer = require('nodemailer');

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      auth: {
        user: 'gowtham.kt@rdsdigital.in',
        pass: '87jnN40tJsLP',
      },
    });

    const info = await transporter.sendMail({
      from: '"Nexus Test" <gowtham.kt@rdsdigital.in>',
      to: 'gowtham.kt@rdsdigital.in',
      subject: 'Zoho SMTP Test',
      html: '<h1>Test from Zoho SMTP</h1><p>If you see this, Zoho credentials are correct.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email via Zoho:', error);
  }
})();
