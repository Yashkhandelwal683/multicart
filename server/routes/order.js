import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-cod', authMiddleware, async (req, res) => {
  try {
    const { items, address, deliveryCharge = 0, serviceCharge = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    if (!address?.name || !address?.phone || !address?.address || !address?.city || !address?.pincode) {
      return res.status(400).json({ message: 'Complete address required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let orderProducts = [];
    let vendors = new Set();
    let productsTotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: 'productId and quantity required' });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
      }

      if (!product.payOnDelivery) {
        return res.status(400).json({ message: `${product.title} does not support COD` });
      }

      orderProducts.push({ product: product._id, quantity: item.quantity, price: product.price });
      vendors.add(product.vendor.toString());
      productsTotal += product.price * item.quantity;
    }

    const totalAmount = productsTotal + deliveryCharge + serviceCharge;

    const order = await Order.create({
      buyer: req.user.id,
      products: orderProducts,
      productVendor: Array.from(vendors),
      productsTotal,
      deliveryCharge,
      serviceCharge,
      totalAmount,
      paymentMethod: 'cod',
      isPaid: false,
      orderStatus: 'pending',
      returnedAmount: 0,
      address,
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    user.cart = [];
    user.orders = user.orders || [];
    user.orders.push(order._id);
    await user.save();

    res.status(201).json({ message: 'COD Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});

export default router;
