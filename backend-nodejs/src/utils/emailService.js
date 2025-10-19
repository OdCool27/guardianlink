const { createTransport } = require('nodemailer');

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendSosAlert = async (toEmail, userName, locationLink) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: `🚨 EMERGENCY ALERT from ${userName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f8f9fa; margin-top: 20px; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 EMERGENCY ALERT</h1>
          </div>
          <div class="content">
            <p><strong>${userName} has activated their SOS emergency alert!</strong></p>
            <p>This is an urgent notification from GuardianLink. Your contact may need immediate assistance.</p>
            <p>Click the button below to view their live location:</p>
            <a href="${locationLink}" class="button">View Live Location</a>
            <p style="margin-top: 20px; font-size: 14px;">If you cannot click the button, copy and paste this link into your browser:<br>${locationLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from GuardianLink. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendCompanionModeAlert = async (toEmail, userName, locationLink, durationMinutes) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: `📍 ${userName} is sharing their location with you`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f8f9fa; margin-top: 20px; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📍 Location Sharing Active</h1>
          </div>
          <div class="content">
            <p><strong>${userName} is sharing their live location with you</strong></p>
            <p>Companion Mode has been activated for approximately ${durationMinutes} minutes.</p>
            <p>Click the button below to view their live location:</p>
            <a href="${locationLink}" class="button">View Live Location</a>
            <p style="margin-top: 20px; font-size: 14px;">If you cannot click the button, copy and paste this link into your browser:<br>${locationLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from GuardianLink. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendSafeNotification = async (toEmail, userName) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: `✅ ${userName} is now safe`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #198754; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f8f9fa; margin-top: 20px; border-radius: 5px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ All Clear</h1>
          </div>
          <div class="content">
            <p><strong>${userName} has marked themselves as safe</strong></p>
            <p>The emergency situation has been resolved. No further action is required.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from GuardianLink. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendSosAlert,
  sendCompanionModeAlert,
  sendSafeNotification
};
