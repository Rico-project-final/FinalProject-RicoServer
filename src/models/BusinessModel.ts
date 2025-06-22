import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  BusinessName: string;
  reviews: mongoose.Types.ObjectId[]; 
  address?: string;
  phone?: string;
  ownerId: mongoose.Types.ObjectId; 

  isGoogleConnected?: boolean; 
  googlePlaceId?: string;   
  googleRefreshToken?: string; 
}   

const businessSchema = new Schema<IBusiness>(
  {
    BusinessName: { type: String, required: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    address: { type: String },
    phone: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    isGoogleConnected: { type: Boolean, default: false },
    googlePlaceId: { type: String, default: null }, 
    googleRefreshToken: { type: String, default: null },

  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>('Business', businessSchema);
