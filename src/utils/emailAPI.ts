// import { Resend } from 'resend';
// import dotenv from 'dotenv';

// dotenv.config();

// const resend = new Resend(process.env.EMAIL_API_KEY);

// export const sendEmail = async ({
//   to,
//   subject,
//   html,
// }: {
//   to: string;
//   subject: string;
//   html: string;
// }) => {
//   try {
//     const response = await resend.emails.send({
//       // from: 'Rico App <noreply@ricoai.cs.colman.ac.il>',
//       from: 'onboarding@resend.dev', // testing only
//       to,
//       subject,
//       html,
//     });

//     // ✅ Check if the response has an ID and no error
//     if (!response || response.error) {
//       console.error('Email not sent:', response.error);
//       throw new Error(
//         response?.error?.message || 'Failed to send email via Resend'
//       );
//     }

//     return response;
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };
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
