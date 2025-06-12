import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { OAuth2Client } from 'google-auth-library';
import env from 'dotenv';
import { Business } from '../models/BusinessModel';

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

        const accessToken = generateAccessToken(user._id.toString(), user.role);

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
//TODO:: change bussiness to be created before user
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

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const user = new User({
            name,
            email,
            password,
            phone,
            profileImage: '', // can be updated later
            role: 'customer'
        });
        await user.save();

        const accessToken = generateAccessToken(user._id.toString(), user.role);

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                role: user.role
            },
            accessToken
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Error creating user', error });
    }
};

// Business Registration
export const registerBusiness = async (req: RegisterBusinessRequest, res: Response): Promise<any> => {

    try {
        const { name, email, password, companyName, phone = ''} = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newBusiness = new Business({
            BusinessName: companyName,
            phone,
            reviews: []
            });

      const savedBusiness = await newBusiness.save();

        let user = new User({
            name,
            email,
            password,
            phone,
            companyName,
            profileImage: '', // can be updated later
            role: 'admin',
            businessId: savedBusiness.id 
        });

        await user.save();

        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8);
            user = new User({
                email,
                name,
                profileImage: '',
                password: randomPassword,
                role: companyName ? 'admin' : 'customer',
                businessId: savedBusiness.id 
        });

    }

      await User.findByIdAndUpdate(user._id, { businessId: savedBusiness._id });

        const accessToken = generateAccessToken(user._id.toString(), user.businessId.toString());
        console.log('bussinesId Token:', user.businessId.toString());

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                role: user.role
            },
            accessToken
        });
    } catch (error) {
        console.error('Register business error:', error);
        res.status(500).json({ message: 'Error creating business', error });
    }

}

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

        const accessToken = generateAccessToken(user._id.toString(), user.businessId? user.businessId.toString() : user.role);


        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                role: user.role
            },
            accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// JWT Generator
export const generateAccessToken = (userId: string, role: string, businessId?: string): string => {
  return jwt.sign(
    { userId, businessId: businessId ?? role },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};


export default { registerUser, registerBusiness, login, customerGoogleSignIn , businessGoogleSignIn };
