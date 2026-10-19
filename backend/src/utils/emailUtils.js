import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail environment variables are missing");
  }

  return transporter.sendMail({
    from: `"ShowTime" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
};

export { sendEmail };
