import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { OAuth2Client } from 'google-auth-library';
import env from 'dotenv';
import { Business } from '../models/BusinessModel';
import { getEmailTemplate } from '../utils/emailTemplates';
import { sendEmail } from '../utils/emailAPI';
import { generateEmailVerificationToken } from '../middleware/auth';
import {  EmailType } from '../utils/emailTemplates';

env.config();

const secret = process.env.JWT_SECRET ?? 'default';
const expiresIn = process.env.JWT_EXPIRES_IN ?? '1h';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Interfaces
interface RegisterUserRequest extends Request {
    body: {
        name: string;
        email: string;
        password: string;
        phone?: string;
    };
}

interface RegisterBusinessRequest extends Request {
    body: {
        name: string;
        email: string;
        password: string;
        companyName: string;
        phone?: string;
    };
}

interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
    };
}
// Google Sign-In for customers
export const customerGoogleSignIn = async (req: Request, res: Response): Promise<any> => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Missing Google credential' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        const { email, picture, name } = payload;
        let user = await User.findOne({ email });

        if (!user) {
            // Auto-register Google user (set random secure password)
            const randomPassword = Math.random().toString(36).slice(-8); // generate 8-char random password
            user = new User({
                email,
                name,
                profileImage: picture || '',
                password: randomPassword,
                role: 'customer'
            });
            await user.save();
        }

        const accessToken = generateAccessToken(
            user._id.toString(),
            user.businessId ? user.businessId.toString() : user.role
            );

        return res.status(200).json({
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Google sign-in error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
// Google Sign-In for businesses
export const businessGoogleSignIn = async (req: Request, res: Response): Promise<any> => {
  try {
    const { credential, businessName, phone, password } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, picture, name } = payload;

    //HERE Google end his job
    let user = await User.findOne({ email });

        const newBusiness = new Business({
        BusinessName: businessName,
        phone,
        reviews: []
      });

      const savedBusiness = await newBusiness.save();


    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      user = new User({
        email,
        name,
        profileImage: picture || '',
        password: password || randomPassword,
        role: businessName ? 'admin' : 'customer',
        businessId: savedBusiness._id 
      });

      user = await user.save();
    }


    //add here updating business
      await Business.findByIdAndUpdate(savedBusiness._id, {
  ownerId: user._id
});

    const accessToken = generateAccessToken(user._id.toString(), user.businessId.toString());

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        businessId: user.businessId 
      }
    });

  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// User Registration
export const registerUser = async (req: RegisterUserRequest, res: Response): Promise<any> => {
  try {
    const { name, email, password, phone = '' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      profileImage: '',
      role: 'customer',
      emailVerified: false,
    });

    await user.save();

    // 🔐 Generate email verification token and link
    const token = generateEmailVerificationToken(user._id.toString());
    const verificationLink = `${process.env.DOMAIN_URL}/verifyEmail?token=${token}`;

    try {
      const { subject, html } = getEmailTemplate({
        emailType: 'customer-verification',
        data: { name, verificationLink },
      });

      await sendEmail({ to: email, subject, html });

    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);

      // ❌ Delete user if email fails
      await user.deleteOne();

      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(201).json({
      message: 'User Verification email sent, please verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
};


// Business Registration
export const registerBusiness = async (req: RegisterBusinessRequest, res: Response): Promise<any> => {
  try {
    const { name, email, password, companyName, phone = '' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new business
    const newBusiness = new Business({
      BusinessName: companyName,
      phone,
      reviews: [],
    });

    const savedBusiness = await newBusiness.save();

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      companyName,
      profileImage: '',
      role: 'admin',
      businessId: savedBusiness._id,
      emailVerified: false, // Ensure this field exists in the User schema
    });

    await user.save();

    await User.findByIdAndUpdate(user._id, { businessId: savedBusiness._id });

    // 🔐 Generate email verification token and link
    const token = generateEmailVerificationToken(user._id.toString());
    const verificationLink = `${process.env.DOMAIN_URL}/verifyEmail?token=${token}`;


    // 📧 Send email verification
    try {
      const { subject, html } = getEmailTemplate({
        emailType: 'admin-verification',
        data: { name, verificationLink },
      });

      await sendEmail({
        to: email,
        subject,
        html,
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    // ✅ Return response: user created, now must verify
    res.status(201).json({
      message: 'User registered. Verification email sent.',
      userId: user._id,
    });
  } catch (error) {
    console.error('Register business error:', error);
    res.status(500).json({ message: 'Error creating business', error });
  }
};

// User Login
export const login = async (req: LoginRequest, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'email or password incorrect' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'email or password incorrect' });
    }
    //TODO :: Front handle this case
    // 🚫 Block unverified
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const accessToken = generateAccessToken(
      user._id.toString(),
      user.businessId ? user.businessId.toString() : user.role
    );

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid token' });
  }

  try {
    // 🔐 Verify the token
    const payload = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET!) as { userId: string };

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // ✅ Mark as verified
    user.emailVerified = true;
    await user.save();

    // 🎉 Send welcome email
    try {
      await sendVerificationOrWelcomeEmail({ user, type: 'welcome' });
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    // 🔑 Generate access token
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.businessId ? user.businessId.toString() : user.role
    );

    return res.status(200).json({
      message: 'Email verified successfully. You are now logged in.',
      user,
      accessToken,
    });
  } catch (error: any) {
    console.error('Email verification failed:', error);

    if (error.name === 'TokenExpiredError') {
      try {
        const expiredPayload = jwt.decode(token) as { userId: string } | null;
        if (!expiredPayload?.userId) {
          return res.status(400).json({ message: 'Token expired and user could not be identified.' });
        }

        const user = await User.findById(expiredPayload.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.emailVerified) return res.status(400).json({ message: 'Email is already verified' });

        const newToken = generateEmailVerificationToken(user._id.toString());
        const newLink = `${process.env.DOMAIN_URL}/verifyEmail?token=${newToken}`;

        await sendVerificationOrWelcomeEmail({
          user,
          type: 'verification',
          verificationLink: newLink,
        });

        return res.status(400).json({
          message: 'Verification link expired. A new verification email has been sent.',
        });
      } catch (reissueError) {
        console.error('Failed to re-send verification email:', reissueError);
        return res.status(500).json({ message: 'Token expired and re-verification failed' });
      }
    }

    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};

const sendVerificationOrWelcomeEmail = async ({
  user,
  type,
  verificationLink,
}: {
  user: any;
  type: 'welcome' | 'verification';
  verificationLink?: string;
}) => {
  let emailType: EmailType;

  if (type === 'welcome') {
    emailType = user.role === 'admin' ? 'admin-welcome' : 'customer-welcome';
  } else {
    emailType = user.role === 'admin' ? 'admin-verification' : 'customer-verification';
  }

  const { subject, html } = getEmailTemplate({
    emailType,
    data:
      type === 'welcome'
        ? { name: user.name }
        : { name: user.name, verificationLink },
  });

  await sendEmail({
    to: user.email,
    subject,
    html,
  });
};

// JWT Generator
export const generateAccessToken = (userId: string, role: string, businessId?: string): string => {
  return jwt.sign(
    { userId, businessId: businessId ?? role },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};


export default {verifyEmail, registerUser, registerBusiness, login, customerGoogleSignIn , businessGoogleSignIn };
