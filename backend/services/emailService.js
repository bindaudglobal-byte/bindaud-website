const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { getEnv, getNumber, getBoolean } = require("../config/env");

const resendApiKey = getEnv("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromAddress = getEnv("EMAIL_FROM") || "onboarding@resend.dev";
const adminEmail = getEnv("ADMIN_EMAIL") || "hello@bindaud.com";
const supportEmail = getEnv("SUPPORT_EMAIL") || adminEmail;
const brandUrl = getEnv("BRAND_URL") || "https://bindaud.com";
const logoUrl = `${brandUrl}/assets/logo/logo.png`;

const smtpHost = getEnv("SMTP_HOST");
const smtpPort = getNumber("SMTP_PORT", 0);
const smtpSecure = getBoolean("SMTP_SECURE", smtpPort === 465);
const smtpUser = getEnv("SMTP_USER");
const smtpPass = getEnv("SMTP_PASS");

let smtpTransport;
if (smtpHost && smtpPort) {
  smtpTransport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });
}

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `PKR ${amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildOrderEmailHtml = ({
  title,
  intro,
  status,
  order,
  note,
  supportInfo = supportEmail,
}) => {
  const normalizedOrder = order || {};
  const products = Array.isArray(normalizedOrder.products)
    ? normalizedOrder.products
    : [];
  const itemRows = products.length
    ? products
        .map(
          (item) => `
            <tr>
              <td style="padding:12px 8px; border-bottom:1px solid #f0e6d8;">${escapeHtml(item.name || "Product")}</td>
              <td style="padding:12px 8px; border-bottom:1px solid #f0e6d8;">${Number(item.quantity || 1)}</td>
              <td style="padding:12px 8px; border-bottom:1px solid #f0e6d8;">${formatCurrency(item.price || 0)}</td>
            </tr>`,
        )
        .join("")
    : '<tr><td colspan="3" style="padding:12px 8px;">No item details were provided.</td></tr>';

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0; padding:0; background:#f6efe6; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
      <div style="max-width:680px; margin:24px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#071d33 0%,#21486B 100%); padding:28px 24px; text-align:center;">
          <img src="${logoUrl}" alt="BIN DAUD" style="width:96px; height:auto; border-radius:16px;" />
          <h1 style="margin:12px 0 4px; font-size:28px; color:#fff;">BIN DAUD</h1>
          <p style="margin:0; color:#e7f0ff;">Luxury streetwear, delivered with care.</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 12px; font-size:16px;">Hi ${escapeHtml(normalizedOrder.customerName || "Customer")},</p>
          <h2 style="margin:0 0 10px; font-size:22px; color:#21486B;">${escapeHtml(title)}</h2>
          <p style="margin:0 0 16px; line-height:1.6;">${escapeHtml(intro)}</p>
          <div style="background:#f9f4eb; border:1px solid #efe1c7; border-radius:12px; padding:16px; margin-bottom:16px;">
            <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${escapeHtml(normalizedOrder.orderNumber || normalizedOrder.id || "Pending")}</p>
            <p style="margin:0 0 6px;"><strong>Current Status:</strong> ${escapeHtml(status)}</p>
            <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${escapeHtml(normalizedOrder.paymentMethod || "Cash on Delivery")}</p>
            <p style="margin:0;"><strong>Grand Total:</strong> ${formatCurrency(normalizedOrder.total || 0)}</p>
          </div>
          <h3 style="margin:0 0 10px; font-size:18px; color:#21486B;">Order Timeline</h3>
          <p style="margin:0 0 12px; line-height:1.6;">${escapeHtml(note || "We will keep you updated as your order moves through our fulfillment center.")}</p>
          <table style="width:100%; border-collapse:collapse; margin:12px 0 20px;">
            <thead>
              <tr style="background:#21486B; color:#fff; text-align:left;">
                <th style="padding:12px 8px;">Product</th>
                <th style="padding:12px 8px;">Qty</th>
                <th style="padding:12px 8px;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="background:#fff9f1; border:1px solid #efd8b2; border-radius:12px; padding:16px; margin-bottom:16px;">
            <p style="margin:0 0 6px;"><strong>Shipping Address:</strong> ${escapeHtml(normalizedOrder.address || "To be confirmed")}</p>
            <p style="margin:0 0 6px;"><strong>City:</strong> ${escapeHtml(normalizedOrder.city || "To be confirmed")}</p>
            <p style="margin:0;"><strong>Phone:</strong> ${escapeHtml(normalizedOrder.phone || "To be confirmed")}</p>
          </div>
          <p style="margin:0 0 12px; line-height:1.6;">Need help? Reach us at <a href="mailto:${supportInfo}" style="color:#21486B;">${escapeHtml(supportInfo)}</a>.</p>
          <p style="margin:0 0 8px; font-size:13px; color:#6b7280;">Follow us on Instagram and Facebook for the latest drops.</p>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <a href="https://www.instagram.com/bindaudglobal/" style="color:#21486B; text-decoration:none;">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=61591782530716" style="color:#21486B; text-decoration:none;">Facebook</a>
            <a href="https://wa.me/923288582902" style="color:#21486B; text-decoration:none;">WhatsApp</a>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const sendMail = async ({ to, subject, html, text }) => {
  const recipients = Array.isArray(to) ? to : [to];
  const message = {
    from: fromAddress,
    to: recipients,
    subject,
    html,
    text: text || subject,
  };

  if (smtpTransport) {
    try {
      const info = await smtpTransport.sendMail(message);
      logger.info("SMTP email sent", { messageId: info.messageId });
      return { success: true, id: info.messageId };
    } catch (smtpError) {
      logger.warn(
        "SMTP send failed, falling back to Resend API if available.",
        smtpError.message,
      );
    }
  }

  if (!resend) {
    logger.warn("No email provider configured. Skipping email notification.");
    return { success: true, skipped: true };
  }

  const response = await resend.emails.send({
    from: fromAddress,
    to: recipients,
    subject,
    html,
    text: text || subject,
  });

  return { success: true, id: response?.data?.id || null };
};

const generateTrackingNumber = () => {
  const year = new Date().getFullYear();
  const sequence = String(Date.now()).slice(-6);
  return `BD-${year}-${sequence}`;
};

const sendOrderStatusUpdate = async (order, status) => {
  const normalizedOrder = order || {};
  const subject = `BIN DAUD | ${status} | ${normalizedOrder.orderNumber || normalizedOrder.id || "Order"}`;
  const html = buildOrderEmailHtml({
    title: status,
    intro: `Your order is now ${status.toLowerCase()}. We have updated the latest status for your BIN DAUD purchase.`,
    status,
    order: normalizedOrder,
    note: `Your order ${normalizedOrder.orderNumber || normalizedOrder.id || "reference"} has been updated to ${status}.`,
  });

  return sendMail({
    to: normalizedOrder.email || supportEmail,
    subject,
    html,
    text: `${status} update for order ${normalizedOrder.orderNumber || normalizedOrder.id || "reference"}`,
  });
};

const sendOrderConfirmation = async (order) => {
  const normalizedOrder = order || {};
  const html = buildOrderEmailHtml({
    title: "Order Received",
    intro:
      "Thank you for placing your order with BIN DAUD. We have received it and will confirm the next step shortly.",
    status: normalizedOrder.status || "Payment Pending",
    order: normalizedOrder,
    note: "We will keep you updated as soon as your order moves to payment verification, fulfillment, or dispatch.",
  });

  return sendMail({
    to: normalizedOrder.email || supportEmail,
    subject: `BIN DAUD | Order Received | ${normalizedOrder.orderNumber || normalizedOrder.id || "Order"}`,
    html,
    text: `Your BIN DAUD order ${normalizedOrder.orderNumber || normalizedOrder.id || "reference"} has been received.`,
  });
};

const sendShippingUpdate = async (order) =>
  sendOrderStatusUpdate(order, "Shipped");
const sendPaymentPending = async (order) =>
  sendOrderStatusUpdate(order, "Payment Pending");
const sendPaymentVerified = async (order) =>
  sendOrderStatusUpdate(order, "Payment Verified");
const sendOrderConfirmed = async (order) =>
  sendOrderStatusUpdate(order, "Order Confirmed");
const sendProcessing = async (order) =>
  sendOrderStatusUpdate(order, "Processing");
const sendPacked = async (order) => sendOrderStatusUpdate(order, "Packed");
const sendOutForDelivery = async (order) =>
  sendOrderStatusUpdate(order, "Out For Delivery");
const sendDelivered = async (order) =>
  sendOrderStatusUpdate(order, "Delivered");
const sendCancelled = async (order) =>
  sendOrderStatusUpdate(order, "Cancelled");
const sendRefunded = async (order) => sendOrderStatusUpdate(order, "Refunded");
const sendReturned = async (order) => sendOrderStatusUpdate(order, "Returned");

const sendPasswordReset = async (email, resetToken) => {
  const resetUrl = `${getEnv("CLIENT_URL") || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  const html = buildOrderEmailHtml({
    title: "Password Reset",
    intro: "We received a password reset request for your BIN DAUD account.",
    status: "Account",
    order: {},
    note: `Use the secure link below to reset your password: <a href="${resetUrl}" style="color:#21486B;">${resetUrl}</a>`,
  });

  return sendMail({
    to: email,
    subject: "BIN DAUD | Reset your password",
    html,
  });
};

const sendWelcome = async (email, name) => {
  const html = buildOrderEmailHtml({
    title: "Welcome to BIN DAUD",
    intro: `Welcome aboard, ${name || "friend"}. Your BIN DAUD account is ready and you can now track every order with ease.`,
    status: "Welcome",
    order: {},
    note: "Please keep an eye on your inbox for order updates, payment confirmations, and your latest shopping notes.",
  });

  return sendMail({ to: email, subject: "BIN DAUD | Welcome", html });
};

const sendEmailVerification = async (email, verificationLink) => {
  const html = buildOrderEmailHtml({
    title: "Verify your email",
    intro:
      "Please verify your email to unlock order tracking and account-based notifications.",
    status: "Account",
    order: {},
    note: `Verify your email here: <a href="${verificationLink}" style="color:#21486B;">${verificationLink}</a>`,
  });

  return sendMail({ to: email, subject: "BIN DAUD | Verify your email", html });
};

const sendNewsletter = async (email) => {
  const html = buildOrderEmailHtml({
    title: "BIN DAUD Newsletter",
    intro:
      "Thanks for subscribing. We will share new collections, launches, and exclusive offers with you soon.",
    status: "Newsletter",
    order: {},
    note: "Stay tuned for the latest drops at BIN DAUD.",
  });

  return sendMail({ to: email, subject: "BIN DAUD | Newsletter", html });
};

const sendContactReply = async ({ name, email, message }) => {
  const html = buildOrderEmailHtml({
    title: "We received your message",
    intro: `Hi ${name || "there"}, thanks for reaching out to BIN DAUD.`,
    status: "Contact",
    order: {},
    note: message || "We will get back to you shortly.",
  });

  return sendMail({
    to: email,
    subject: "BIN DAUD | We received your message",
    html,
  });
};

const sendAdminNotification = async ({
  email = adminEmail,
  subject,
  message,
}) => {
  const html = buildOrderEmailHtml({
    title: subject || "New BIN DAUD notification",
    intro: message || "A new BIN DAUD event requires your attention.",
    status: "Admin Alert",
    order: {},
    note: "Please review the update in the admin dashboard.",
  });

  return sendMail({
    to: email,
    subject: subject || "BIN DAUD | Admin Notification",
    html,
  });
};

module.exports = {
  sendMail,
  generateTrackingNumber,
  sendOrderConfirmation,
  sendShippingUpdate,
  sendPaymentPending,
  sendPaymentVerified,
  sendOrderConfirmed,
  sendProcessing,
  sendPacked,
  sendOutForDelivery,
  sendDelivered,
  sendCancelled,
  sendRefunded,
  sendReturned,
  sendPasswordReset,
  sendWelcome,
  sendEmailVerification,
  sendNewsletter,
  sendContactReply,
  sendAdminNotification,
  sendOrderStatusUpdate,
};
