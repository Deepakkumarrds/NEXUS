const nodemailer = require('nodemailer');

// Mock email service using Ethereal (or real SMTP if provided)
let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } else {
    // Generate a test account on the fly for Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`✉️ Using Ethereal Test Account: ${testAccount.user}`);
  }
  return transporter;
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailTransporter = await initTransporter();
    
    const info = await mailTransporter.sendMail({
      from: '"Nexus" <gowthamrdsdigital@gmail.com>',
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log('=============================================');
    console.log(`✉️ EMAIL SENT`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (info.messageId && nodemailer.getTestMessageUrl) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    console.log('=============================================');
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

const notifyClientAssetReady = async (clientEmail, assetTitle, portalLink) => {
  const subject = `New Asset for Review: ${assetTitle}`;
  const html = `
    <h2>Hello!</h2>
    <p>Your agency has uploaded a new creative asset for your review: <b>${assetTitle}</b>.</p>
    <p>Please log in to your Client Portal to review and approve it:</p>
    <a href="${portalLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Portal</a>
  `;
  return sendEmail(clientEmail, subject, html);
};

const notifyAgencyAssetApproved = async (agencyEmail, assetTitle, clientFeedback) => {
  const subject = `Asset Approved: ${assetTitle}`;
  let html = `<h2>Good news!</h2><p>The client has <b>Approved</b> the asset: ${assetTitle}.</p>`;
  if (clientFeedback) {
    html += `<p><b>Client Note:</b> ${clientFeedback}</p>`;
  }
  return sendEmail(agencyEmail, subject, html);
};

const notifyAgencyAssetRejected = async (agencyEmail, assetTitle, clientFeedback) => {
  const subject = `Revisions Requested: ${assetTitle}`;
  const html = `
    <h2>Revisions Requested</h2>
    <p>The client has requested revisions for the asset: <b>${assetTitle}</b>.</p>
    <p><b>Feedback:</b> ${clientFeedback || 'No additional comments.'}</p>
    <p>Please check the portal for specific image annotations.</p>
  `;
  return sendEmail(agencyEmail, subject, html);
};

const sendDeadlineReminder = async (clientEmail, assetTitle, portalLink) => {
  const subject = `Reminder: Pending Review for ${assetTitle}`;
  const html = `
    <h2>Reminder!</h2>
    <p>This is a friendly reminder that the asset <b>${assetTitle}</b> is awaiting your approval and is due today.</p>
    <a href="${portalLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Now</a>
  `;
  return sendEmail(clientEmail, subject, html);
};

const sendWelcomeEmail = async (email, name, temporaryPassword, portalLink) => {
  const subject = `Welcome to the RDS Dashboard Portal`;
  const html = `
    <h2>Welcome, ${name}!</h2>
    <p>Your agency has created a client portal account for you.</p>
    <p>Your temporary password is: <b>${temporaryPassword}</b></p>
    <p>Please log in using the link below and change your password immediately.</p>
    <a href="${portalLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Log In</a>
  `;
  return sendEmail(email, subject, html);
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const subject = `Password Reset Request`;
  const html = `
    <h2>Password Reset</h2>
    <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
    <p>Otherwise, click the link below to reset your password. This link will expire in 1 hour.</p>
    <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
  `;
  return sendEmail(email, subject, html);
};

const sendWeeklyReportEmail = async (clientEmail, clientName, reportHtml) => {
  const subject = `Weekly Activity Report: ${clientName}`;
  return sendEmail(clientEmail, subject, reportHtml);
};

const sendLeaveAppliedEmail = async (managerEmail, employeeName, startDate, endDate, leaveType, reason) => {
  const subject = `Leave Request: ${employeeName}`;
  const html = `
    <h2>New Leave Request</h2>
    <p><b>${employeeName}</b> has applied for <b>${leaveType} Leave</b>.</p>
    <p><b>From:</b> ${new Date(startDate).toLocaleDateString()}</p>
    <p><b>To:</b> ${new Date(endDate).toLocaleDateString()}</p>
    <p><b>Reason:</b> ${reason || 'Not provided'}</p>
    <p>Please log in to the dashboard to approve or reject this request.</p>
  `;
  return sendEmail(managerEmail, subject, html);
};

const sendLeaveApprovedEmail = async (employeeEmail, startDate, endDate, leaveType) => {
  const subject = `Leave Approved: ${leaveType} Leave`;
  const html = `
    <h2>Leave Approved</h2>
    <p>Your request for <b>${leaveType} Leave</b> from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} has been <b>Approved</b>.</p>
  `;
  return sendEmail(employeeEmail, subject, html);
};

const sendLeaveRejectedEmail = async (employeeEmail, startDate, endDate, leaveType) => {
  const subject = `Leave Rejected: ${leaveType} Leave`;
  const html = `
    <h2>Leave Rejected</h2>
    <p>Your request for <b>${leaveType} Leave</b> from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} has been <b>Rejected</b>.</p>
    <p>Please contact your manager for more details.</p>
  `;
  return sendEmail(employeeEmail, subject, html);
};

const sendDailyTrackerReminder = async (employeeEmail, employeeName, missingClients, timeOfDay) => {
  const isMorning = timeOfDay === 'Morning';
  const subject = isMorning 
    ? `Morning Reminder: Plan your Daily Tracker 🌅`
    : `Evening Reminder: Wrap up your Daily Tracker 🌙`;

  const clientList = missingClients.map(c => `<li><b>${c}</b></li>`).join('');

  const html = `
    <h2>${isMorning ? 'Good morning' : 'Good evening'}, ${employeeName}!</h2>
    <p>${isMorning 
      ? 'You logged in a little while ago. Please plan your day and enter your initial tasks/summaries for the following active clients:' 
      : 'Before you log off for the day, please ensure your final summaries and task statuses are updated for the following active clients:'}</p>
    <ul>
      ${clientList}
    </ul>
    <p>Go to your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracker" style="background-color: #4f46e5; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Daily Tracker</a> to update them.</p>
  `;
  return sendEmail(employeeEmail, subject, html);
};

module.exports = {
  sendEmail,
  notifyClientAssetReady,
  notifyAgencyAssetApproved,
  notifyAgencyAssetRejected,
  sendDeadlineReminder,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendWeeklyReportEmail,
  sendLeaveAppliedEmail,
  sendLeaveApprovedEmail,
  sendLeaveRejectedEmail,
  sendDailyTrackerReminder
};
