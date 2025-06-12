import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  relatedReview?: mongoose.Types.ObjectId; // Optional, link to ReviewAnalysis
  isCompleted: boolean;
  createdBy: mongoose.Types.ObjectId; // Admin ID
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  businessId: mongoose.Types.ObjectId;
  
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  relatedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewAnalysis'
  },
  isCompleted: { type: Boolean, default: false },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: { type: Date },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true }
}, { timestamps: true });

export const Task = mongoose.model<ITask>('Task', taskSchema);
