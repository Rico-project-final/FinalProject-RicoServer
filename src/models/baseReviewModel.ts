import mongoose from 'mongoose';

export interface IBaseReview {
  _id?: mongoose.Types.ObjectId;
  text: string;
  businessId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  isAnalyzed: boolean;
  createdAt?: Date;
  source: 'user' | 'google';
}

