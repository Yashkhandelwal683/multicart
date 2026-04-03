import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/check-admin', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    res.json({ exists: !!admin, adminId: admin?._id || null });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

router.post('/update-vendor-status', authMiddleware, async (req, res) => {
  try {
    const { vendorId, status, rejectedReason } = req.body;
    const vendor = await User.findById(vendorId);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (status === 'approved') {
      vendor.verificationStatus = 'approved';
      vendor.isApproved = true;
      vendor.approvedAt = new Date();
      vendor.rejectedReason = undefined;
    }

    if (status === 'rejected') {
      vendor.verificationStatus = 'rejected';
      vendor.isApproved = false;
      vendor.rejectedReason = rejectedReason || 'Rejected by Admin';
    }

    await vendor.save();
    res.json({ message: 'Vendor status updated', vendor });
  } catch (error) {
    res.status(500).json({ message: `Vendor approval error: ${error.message}` });
  }
});

router.post('/update-product-status', authMiddleware, async (req, res) => {
  try {
    const { productId, status, rejectedReason } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (status === 'approved') {
      product.verificationStatus = 'approved';
      product.approvedAt = new Date();
      product.rejectedReason = undefined;
    }

    if (status === 'rejected') {
      product.verificationStatus = 'rejected';
      product.rejectedReason = rejectedReason || 'Rejected by Admin';
    }

    await product.save();
    res.json({ message: 'Product status updated', product });
  } catch (error) {
    res.status(500).json({ message: `Product approval error: ${error.message}` });
  }
});

export default router;
