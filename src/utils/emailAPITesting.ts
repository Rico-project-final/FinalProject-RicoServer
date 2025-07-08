import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.office365.com or smtp.gmail.com
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER, // e.g., yourname@cs.colman.ac.il
    pass: process.env.SMTP_PASS, // password or app-specific password
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const response = await transporter.sendMail({
      from: `"Rico App" <${process.env.SMTP_USER}>`, // must match authenticated user
      to,
      subject,
      html,
    });

    // ✅ Check if the messageId is present (indicates success)
    if (!response?.messageId) {
      console.error('Email not sent:', response);
      throw new Error('Failed to send email via SMTP');
    }

    return response;
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    throw error;
  }
};
