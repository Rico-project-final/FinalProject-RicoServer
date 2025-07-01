import mongoose, { Document, Schema } from 'mongoose';
import { IBaseReview } from './baseReviewModel';

export interface IGoogleReview extends IBaseReview {
  reviewId: string; // Optional field for Google review ID
  text: string;
  authorName?: string;
  category?: 'food' | 'service' | 'overall';
  isAnalyzed: boolean;
  createdAt?: Date;
  businessId: mongoose.Types.ObjectId;
  source: 'google';
}

const googleReviewSchema = new Schema<IGoogleReview>({
  reviewId: {
    type: String,
    required: true, 
    unique: true,
  },
  text: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: false,
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
  createdAt: {
    type: Date,
    required: false,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
    source: {
    type: String,
    enum: ['google'], 
    default: 'google',
    required: true
  }
}, {
  timestamps: true,
});

export const GoogleReview = mongoose.model<IGoogleReview>('GoogleReview', googleReviewSchema);
