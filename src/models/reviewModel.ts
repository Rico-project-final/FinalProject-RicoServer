import mongoose, { Document, Schema } from 'mongoose';

export interface IReview {
id: mongoose.Types.ObjectId;
userId: mongoose.Types.ObjectId | null;
text : string;
category: 'food' | 'service' | 'overall';
}

const reviewSchema = new Schema<IReview>({
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
    enum: ['food', 'service', 'overall'],
    required: true,
},
}, {

})

export const review = mongoose.model<IReview>('Review', reviewSchema);