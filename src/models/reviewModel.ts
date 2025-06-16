import mongoose, { Document, Schema } from 'mongoose';

export interface IReview {
id: mongoose.Types.ObjectId;
userId?: mongoose.Types.ObjectId | null;
text : string;
category?: 'food' | 'service' | 'experience';
isAnalyzed: boolean;
businessId: mongoose.Types.ObjectId;

}

const reviewSchema = new Schema<IReview>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,  
        default: null    
    },
text: {
    type: String,
    required: true,
},
category: {
    type: String,
    enum: ['food', 'service', 'experience'],
    required: false,
},
isAnalyzed: {
    type: Boolean,
    default: false,
  },
businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true }
}, {
    timestamps: true
})

export const Review = mongoose.model<IReview>('Review', reviewSchema);