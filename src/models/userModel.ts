  import mongoose, { Document, Schema } from 'mongoose';
  import bcrypt from 'bcrypt';

  export interface IUser {
      id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      phone?: string;
      password: string;
      profileImage: string;
      role: 'admin' | 'customer';
      businessId: mongoose.Types.ObjectId;
      comparePassword(candidatePassword: string): Promise<boolean>;
    }
    
    const userSchema = new Schema<IUser>({
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
          validator: function (value: string) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          },
          message: 'Invalid email format',
        },
      },
      phone: {
        type: String,
        required: false,
        validate: {
          validator: function (value: string) {
            return /^\d{10}$/.test(value);
          },
          message: 'Validating error - Invalid phone number format',
        },
      },
      password: {
        type: String,
        required: true,
        minlength: 6,
      },
      profileImage: {
        type: String,
      },
      role: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer',
        required: true
      },
      businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: function (this: IUser) {
        return this.role === 'admin';
      }
      } 
    }, {
      timestamps: true
    });

  // Hash password before saving
  userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    next();
  });

  // Compare password method
  userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  };

  export const User = mongoose.model<IUser>('User', userSchema);