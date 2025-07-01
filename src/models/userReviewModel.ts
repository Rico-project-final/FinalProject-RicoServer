import mongoose, { Document, Schema } from 'mongoose';
import { IBaseReview } from './baseReviewModel';

export interface IUserReview extends IBaseReview {
  userId?: mongoose.Types.ObjectId;
  text: string;
  category?: 'food' | 'service' | 'overall';
  isAnalyzed: boolean;
  businessId: mongoose.Types.ObjectId;
  createdAt?: Date;
  source: 'user';
}

const reviewSchema = new Schema<IUserReview>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  text: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['food', 'service', 'overall'],
    required: false,
  },
  isAnalyzed: {
    type: Boolean,
    default: false,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
    source: {
    type: String,
    enum: ['user'], 
    default: 'user',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const UserReview = mongoose.model<IUserReview>('Review', reviewSchema);
