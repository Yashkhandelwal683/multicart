import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  isStockAvailable: { type: Boolean, default: true },
  image1: { type: String, required: true },
  image2: { type: String },
  image3: { type: String },
  image4: { type: String },
  category: { type: String, required: true },
  isWearable: { type: Boolean, default: false },
  sizes: { type: [String], default: [] },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectedReason: { type: String },
  approvedAt: { type: Date },
  isActive: { type: Boolean, default: false },
  replacementDays: { type: Number, default: 0 },
  freeDelivery: { type: Boolean, default: false },
  warranty: { type: String, default: 'No Warranty' },
  payOnDelivery: { type: Boolean, default: false },
  detailsPoints: { type: [String], default: [] },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
