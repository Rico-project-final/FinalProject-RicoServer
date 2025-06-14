import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.EMAIL_API_KEY);

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
    const response = await resend.emails.send({
      from: 'Rico App <noreply@yourdomain.com>', // replace with verified sender
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
