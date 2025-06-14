import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId? : string;
  businessId? : string;
  accessToken?: string;
}

export const authenticateJwt = (req: AuthRequest, res: Response, next: NextFunction):any => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string , role?:string, businessId?: string };
    req.userId = decoded.userId;
    console.log('decoded', decoded);
    if(decoded.businessId) {
      req.businessId = decoded.businessId;

    }
   return next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
export const optionalAuthenticateJwt = (req: Request & { userId?: string }, res: Response, next: NextFunction):any => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default') as { userId: string };
          req.userId = decoded.userId;
      } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
  }

 return next();
};
