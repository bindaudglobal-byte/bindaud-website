const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
const user = process.env.EMAIL_USER || process.env.SMTP_USER;
const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

const sendMail = async ({ to, subject, html }) => {
  if (!host || !user || !pass) {
    logger.warn('Email service is not configured (EMAIL_* or SMTP_* env missing). Skipping notification.');
    return { success: true, skipped: true };
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@bindaud.com',
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
};

const sendOrderConfirmation = async (order) => {
  const html = `
    <h2>Thank you for your order</h2>
    <p>Your order <strong>${order.orderNumber}</strong> has been received.</p>
    <p>Total: PKR ${order.total}</p>
  `;

  return sendMail({
    to: order.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html,
  });
};

const sendShippingUpdate = async (order) => {
  const html = `
    <h2>Your order is on the way</h2>
    <p>Your order <strong>${order.orderNumber}</strong> has been shipped.</p>
    <p>Tracking Number: ${order.trackingNumber || 'Pending'}</p>
  `;

  return sendMail({
    to: order.email,
    subject: `Shipping Update - ${order.orderNumber}`,
    html,
  });
};

const sendPasswordReset = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
  `;

  return sendMail({
    to: email,
    subject: 'Reset your password',
    html,
  });
};

const sendContactForm = async ({ name, email, message }) => {
  const html = `
    <h2>New Contact Message</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong> ${message}</p>
  `;

  return sendMail({
    to: process.env.EMAIL_FROM || 'hello@bindaud.com',
    subject: 'New contact form submission',
    html,
  });
};

module.exports = {
  sendMail,
  sendOrderConfirmation,
  sendShippingUpdate,
  sendPasswordReset,
  sendContactForm,
};
