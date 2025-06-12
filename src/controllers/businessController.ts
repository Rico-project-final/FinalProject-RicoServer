import { Request, Response } from 'express';
import { Business } from '../models/BusinessModel';
import {User} from '../models/userModel';

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

export default {
  getAllbusinesses,
  getbusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
