import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Review } from '../models/reviewModel';
import { Task } from '../models/taskModel';
import mongoose from 'mongoose';

// Get all customers
export const getAllUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    // @ts-ignore - businessId is injected via JWT middleware
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    // Step 1: Get distinct non-null userIds from reviews
    const userIds = await Review.distinct('userId', {
      businessId,
      userId: { $ne: null },
    });

    // Step 2: Fetch user documents for those IDs
    const users = await User.find({ _id: { $in: userIds } }).select('-password'); // Exclude sensitive fields

    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get specific user by ID (public or protected, depending on route use)
export const getUserById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};

// Get own profile (protected)
export const getProfile = async (req: Request & { userId?: string }, res: Response): Promise<any> => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// Update own profile (protected)
export const updateProfile = async (req: Request & { userId?: string }, res: Response): Promise<any> => {
    try {
        const updates = req.body;

        if (updates.password) {
            delete updates.password; // Block password updates here; handle separately if needed
        }

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// Delete own profile (protected)
export const deleteProfile = async (req: Request & { userId?: string }, res: Response): Promise<any> => {
    try {
        const user = await User.findByIdAndDelete(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({ message: 'Error deleting profile' });
    }
};

const getDashboard = async (req: Request, res: Response): Promise<any> => {
  try {
    // @ts-ignore - businessId injected by your JWT middleware
    const businessId = req.businessId;
    console.log('businessId:', businessId);
    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    // Count non-admin users belonging to the business (assuming User has businessId too)
    const totalClients = await User.countDocuments({
      role: { $ne: 'admin' },
      businessId
    });

    // Count reviews and tasks for the business
    const totalReviews = await Review.countDocuments({ businessId });
    const totalTasks = await Task.countDocuments({ businessId });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lastWeekReviews = await Review.find({
      businessId,
      createdAt: { $gte: oneWeekAgo }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const reviewsByMonth = await Review.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), createdAt: { $gte: startOfYear } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            category: "$category"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const chartData: Record<string, any>[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 12; i++) {
      chartData.push({
        name: months[i],
        food: 0,
        service: 0,
        overall: 0,  // fixed category name here
      });
    }

    reviewsByMonth.forEach(item => {
      const index = item._id.month - 1;
      chartData[index][item._id.category] = item.count;
    });

    return res.status(200).json({
      totalClients,
      totalTasks,
      totalReviews,
      lastWeekReviews,
      chartData,
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
};
export default {
    getAllUsers,
    getUserById,
    getProfile,
    updateProfile,
    deleteProfile,
    getDashboard
};