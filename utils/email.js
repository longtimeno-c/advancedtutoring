const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter for sending emails
const createTransporter = () => {
  if (!config.email.enabled) {
    console.log('Email is disabled. Check .env file to enable it.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  if (!config.email.enabled) {
    console.log('Email is disabled. User will be auto-verified.');
    return true;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  const verificationUrl = `${config.app.url}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: config.email.from,
    to: user.email,
    subject: `Welcome to ${config.app.name} - Verify Your Email`,
    html: `
      <h1>Welcome to ${config.app.name}!</h1>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register on our site, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send access code to new user
const sendAccessCodeEmail = async (email, accessCode, inviterName) => {
  if (!config.email.enabled) {
    console.log('Email is disabled. Access code will not be sent.');
    return true;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  const registrationUrl = `${config.app.url}/register?code=${accessCode}`;

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: `You've Been Invited to Join ${config.app.name}`,
    html: `
      <h1>You've Been Invited to ${config.app.name}!</h1>
      <p>${inviterName} has invited you to join ${config.app.name}.</p>
      <p>Your access code is: <strong>${accessCode}</strong></p>
      <p>Click the button below to register:</p>
      <p>
        <a href="${registrationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Register Now
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${registrationUrl}</p>
      <p>This access code will expire in 7 days.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending access code email:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  if (!config.email.enabled) {
    console.log('Email is disabled. Password reset email will not be sent.');
    return true;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  const resetUrl = `${config.app.url}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: `${config.app.name} - Password Reset Request`,
    html: `
      <h1>Password Reset Request</h1>
      <p>You've requested to reset your password. Click the button below to reset it:</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendAccessCodeEmail,
  sendPasswordResetEmail
}; 