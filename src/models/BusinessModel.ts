import mongoose, { Schema, Document } from 'mongoose';
import { IReview } from './reviewModel'; // Assuming you have a review model

export interface IBusiness extends Document {
    BusinessName : string;
    reviews: mongoose.Types.ObjectId[]; // array of ObjectIds
    address?:string;
    phone?:string;
    ownerId: mongoose.Types.ObjectId; 


}
const businessSchema = new mongoose.Schema<IBusiness>({

  BusinessName: { type: String, required: true },
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  phone: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

},{ timestamps: true });

export const Business = mongoose.model('Business', businessSchema);