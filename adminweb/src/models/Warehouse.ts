import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  _id: string;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Warehouse name cannot be more than 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create compound index for name uniqueness per user
WarehouseSchema.index({ name: 1, createdBy: 1 }, { unique: true });

export default mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
