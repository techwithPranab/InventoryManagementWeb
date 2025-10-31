import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  _id: string;
  productId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  maxStockLevel: number;
  lastUpdated: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  warehouseId: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  reservedQuantity: {
    type: Number,
    min: [0, 'Reserved quantity cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    min: [0, 'Reorder level cannot be negative'],
    default: 0
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Max stock level cannot be negative'],
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for product-warehouse uniqueness per user
InventorySchema.index({ productId: 1, warehouseId: 1, createdBy: 1 }, { unique: true });
InventorySchema.index({ createdBy: 1 });
InventorySchema.index({ quantity: 1 });

// Virtual for available quantity
InventorySchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.reservedQuantity;
});

// Method to check if stock is low
InventorySchema.methods.isLowStock = function() {
  return this.quantity <= this.reorderLevel;
};

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
