const nodemailer = require('nodemailer');

// Mock email service using Ethereal (or real SMTP if provided)
let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
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

const sendEmail = async (to, subject, htmlContent, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const mailTransporter = await initTransporter();
      
      const info = await mailTransporter.sendMail({
        from: `"Nexus" <${process.env.SMTP_USER || 'gowthamrdsdigital@gmail.com'}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      });

      console.log('=============================================');
      console.log(`✉️ EMAIL SENT (Attempt ${attempt}/${retries})`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('=============================================');
      
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed to send email to ${to}:`, error.message);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, 1500 * attempt));
      }
    }
  }
  return false;
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

const sendMomEmail = async (toEmail, meeting) => {
  const subject = `Minutes of Meeting (MOM): ${meeting.meeting_title}`;
  const brandName = meeting.client?.brand_name || meeting.client?.company_name || 'Client';
  const meetingDateStr = meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  let actionItemsHtml = '';
  if (meeting.action_items && meeting.action_items.length > 0) {
    actionItemsHtml = `
      <h3 style="color: #0f172a; margin-top: 24px;">Assigned Action Items</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Action Item</th>
            <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Assignee</th>
            <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${meeting.action_items.map(item => `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${item.action_item}</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${item.assignee?.name || 'Unassigned'}</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-top: 0;">Minutes of Meeting (MOM)</h2>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Meeting:</strong> ${meeting.meeting_title}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Brand:</strong> ${brandName}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${meetingDateStr}</p>
      ${meeting.attendees ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Attendees:</strong> ${meeting.attendees}</p>` : ''}
      
      ${meeting.agenda ? `
        <div style="margin-top: 16px;">
          <h4 style="color: #0f172a; margin-bottom: 4px;">Agenda</h4>
          <p style="background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 14px; margin-top: 0;">${meeting.agenda}</p>
        </div>
      ` : ''}

      <div style="margin-top: 16px;">
        <h4 style="color: #0f172a; margin-bottom: 4px;">Key Discussion Points & Decisions</h4>
        <div style="background: #f8fafc; padding: 12px; border-radius: 4px; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${meeting.discussion_points || 'No discussion points logged.'}</div>
      </div>

      ${actionItemsHtml}

      <div style="margin-top: 24px; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/meetings" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Open Meetings Dashboard</a>
      </div>
    </div>
  `;

  return sendEmail(toEmail, subject, html);
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
  sendDailyTrackerReminder,
  sendMomEmail
};
