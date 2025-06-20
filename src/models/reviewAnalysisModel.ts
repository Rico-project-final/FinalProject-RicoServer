import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewAnalysis extends Document {
  reviewId: string; // reference to the original review
  userId: mongoose.Types.ObjectId; // who wrote the review
  text: string; // copy of the review text
  category: 'food' | 'service' | 'overall experience';
  sentiment: 'positive' | 'neutral' | 'negative'; // result from AI
  analysisSummary: string; // optional explanation by OpenAI
  suggestions?: string; // generated suggestion for admin, if it is repetitive problem
  adminResponse?: string; // response to the customer - generated by AI
  isResolved: boolean; 
  createdAt: Date;
  updatedAt: Date;
  businessId: mongoose.Types.ObjectId;
  
}

const reviewAnalysisSchema = new Schema<IReviewAnalysis>({
  reviewId: {
    type: String,
    ref: 'Review',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['food', 'service', 'overall experience'],
    required: true,
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    required: true,
  },
  analysisSummary: {
    type: String,
  },
  suggestions: {
    type: String,
  },
  adminResponse: {
    type: String,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true }
}, {
  timestamps: true,
});

export const ReviewAnalysis = mongoose.model<IReviewAnalysis>('ReviewAnalysis', reviewAnalysisSchema);
