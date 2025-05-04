import { Request, Response, NextFunction } from 'express';
import { User } from '../models/userModel';

interface checkRequest extends Request {
    userId? : string;
  }
export const checkAdmin = async (req: checkRequest, res: Response, next: NextFunction):Promise<any> => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: admin only' });
        }
        return next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Error checking admin permissions' });
    }
};
