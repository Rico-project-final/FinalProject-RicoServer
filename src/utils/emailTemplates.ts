type EmailType =
  | 'admin-welcome'
  | 'admin-verification'
  | 'customer-welcome'
  | 'admin-response-to-customer';

interface TemplateProps {
  emailType: EmailType;
  data: any;
}
//TODO :: add customer verification email
export const getEmailTemplate = ({ emailType, data }: TemplateProps): { subject: string; html: string } => {
  switch (emailType) {
    case 'admin-welcome':
      return {
        subject: 'Welcome to RICO - Manage Your Business with AI',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color:#006bb3">Welcome, ${data.name}!</h2>
            <p>We're excited to have you join RICO as a business admin. Start responding to reviews, analyzing feedback, and building trust with your customers.</p>
            <p style="margin-top:30px;">Enjoy your journey,<br><strong>RICO Team</strong></p>
          </div>
        `,
      };

    case 'admin-verification':
      return {
        subject: 'Verify Your Email - RICO Business Account',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color:#006bb3">Hi ${data.name}, confirm your email</h2>
            <p>Click below to verify your email and activate your RICO business dashboard.</p>
            <a href="${data.verificationLink}" style="display:inline-block; margin-top:15px; background:#006bb3; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Verify Email</a>
          </div>
        `,
      };

    case 'customer-welcome':
      return {
        subject: 'Welcome to RICO!',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color:#006bb3">Hi ${data.name}, welcome to RICO 🎉</h2>
            <p>We're thrilled to have you on board. You can now leave reviews, explore top-rated businesses, and contribute to the community.</p>
            <p>Thank you for joining us!<br>– RICO Team</p>
          </div>
        `,
      };

    case 'admin-response-to-customer':
      return {
        subject: `A response from ${data.businessName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color:#006bb3">Hi ${data.customerName},</h2>
            <p>${data.businessName} has responded to your recent review:</p>
            <blockquote style="margin:20px 0; padding:15px; background:#f4f4f4; border-left:5px solid #006bb3;">
              ${data.responseText}
            </blockquote>
            <p>Thanks for being part of RICO!<br>– RICO Team</p>
          </div>
        `,
      };

    default:
      throw new Error('Unknown email type');
  }
};
