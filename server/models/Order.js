import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productsTotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'stripe'], required: true },
  isPaid: { type: Boolean, default: false },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'returned', 'cancelled'],
    default: 'pending',
  },
  cancelledAt: { type: Date },
  returnedAmount: { type: Number, default: 0 },
  address: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  paymentDetails: {
    stripePaymentId: String,
    stripeSessionId: String,
  },
  deliveryDate: { type: Date },
  deliveryOtp: { type: String },
  otpExpiresAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
