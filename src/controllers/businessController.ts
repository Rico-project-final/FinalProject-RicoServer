import { Request, Response } from 'express';
import { Business } from '../models/BusinessModel';
import {User} from '../models/userModel';
import { generateBusinessQR } from '../utils/QRGenerator';
import { sendEmail } from '../utils/emailAPI';
import { getEmailTemplate } from '../utils/emailTemplates';

import dotenv from 'dotenv';

dotenv.config();

const DOMAIN_URL = process.env.DOMAIN_URL ?? 'http://localhost:5173';

// GET all 
export const getAllbusinesses = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  try {
    const tasks = await Business.find({}) //POPulate?
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// GET business by ID
export const getbusinessById = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { businessId } = req.params;
  try {
    const task = await Business.findOne({ _id: businessId})//populate?
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

// CREATE new business
export const createBusiness = async (req: Request, res: Response): Promise<any> => {
  const { BusinessName, name, address, email, password, phone } = req.body;

  try {
    // 1. Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 2. Check if business name is taken
    const existingBusiness = await Business.findOne({ BusinessName });
    if (existingBusiness) {
      return res.status(400).json({ message: 'Business name is already taken' });
    }

    // 3. Create the admin user
    const newUser = new User({
      name,
      email,
      phone,
      password,
      role: 'admin',
      profileImage: '',
      businessId: null,
    });

    const savedUser = await newUser.save();

    // 4. Create the business and link to the user
    const newBusiness = new Business({
      BusinessName,
      address,
      phone,
      reviews: [],
      ownerId: savedUser._id
    });

    const savedBusiness = await newBusiness.save();

    // 5. Update user's businessId
    const updatedUser = await User.findByIdAndUpdate(
      savedUser._id,
      { businessId: savedBusiness._id },
      { new: true }
    );

    res.status(201).json({
      message: 'Business and owner created successfully',
      business: savedBusiness,
      owner: updatedUser
    });

  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ message: 'Error creating business', error });
  }
};

// UPDATE business?
export const updateBusiness = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { businessId } = req.params;
  const updates = req.body;
  try {
    const updatedTask = await Business.findOneAndUpdate(
      { _id: businessId},
      updates,
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
};

// DELETE business
export const deleteBusiness = async (req: Request& { userId?: string }, res: Response):Promise<any> => {
  const { businessId } = req.params;
  try {
    const deletedTask = await Business.findOneAndDelete({ _id: businessId});
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
};
export const getQRCodeForBusiness = async (req: Request & { businessId?: string }, res: Response): Promise<any> => {
  try {
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ error: 'Missing businessId from token' });
    }

    const qrBuffer = await generateBusinessQR(businessId, DOMAIN_URL);
    const base64Image = qrBuffer.toString('base64');

    res.status(200).json({
      message: 'QR code generated successfully',
      image: `data:image/png;base64,${base64Image}`
    });
  } catch (error) {
    console.error('QR generation failed:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};
export const sendResponseToCustomer = async (req: Request & { businessId?: string }, res: Response): Promise<any> => {
  try {
    const { businessId } = req;
    const { customerName, customerEmail, responseText } = req.body;

    if (!businessId || !customerEmail || !customerName || !responseText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Fetch the business and its owner
    const business = await Business.findById(businessId).populate('ownerId');
    if (!business || !business.ownerId) {
      return res.status(404).json({ message: 'Business not found or has no owner' });
    }

    
    const { subject, html } = getEmailTemplate({
      emailType: 'admin-response-to-customer',
      data: {
        customerName,
        businessName: business.BusinessName,
        responseText,
      },
    });

    // ✅ Send email to customer
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html,
    });

    res.status(200).json({ message: 'Response email sent to customer', result });
  } catch (error) {
    console.error('Error sending response email:', error);
    res.status(500).json({ message: 'Error sending email', error });
  }
};

export default {
  sendResponseToCustomer,
  getAllbusinesses,
  getbusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getQRCodeForBusiness
};
