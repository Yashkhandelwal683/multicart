import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/all-vendor', async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).populate('vendorProducts').sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendors', error: error.message });
  }
});

router.post('/add-product', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, stock, category, image1, image2, image3, image4, isWearable, sizes, replacementDays, freeDelivery, warranty, payOnDelivery, detailsPoints } = req.body;

    if (!title || !description || !price || !stock || !category || !image1 || !image2 || !image3 || !image4) {
      return res.status(400).json({ message: 'All fields & 4 images required' });
    }

    if (isWearable && (!sizes || sizes.length === 0)) {
      return res.status(400).json({ message: 'Sizes are required for wearable product' });
    }

    const product = await Product.create({
      title,
      description,
      price,
      stock,
      isStockAvailable: stock > 0,
      image1,
      image2,
      image3,
      image4,
      category,
      vendor: req.user.id,
      isWearable: isWearable || false,
      sizes: isWearable ? sizes : [],
      replacementDays: replacementDays || 0,
      freeDelivery: freeDelivery || false,
      warranty: warranty || 'No Warranty',
      payOnDelivery: payOnDelivery || false,
      detailsPoints: detailsPoints || [],
      verificationStatus: 'pending',
      isActive: false,
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { vendorProducts: product._id } });

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
});

router.get('/all-products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

router.get('/active-product', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user.id, isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

router.put('/update-product', authMiddleware, async (req, res) => {
  try {
    const { productId, ...updates } = req.body;
    const product = await Product.findOneAndUpdate({ _id: productId, vendor: req.user.id }, updates, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: `Update product error: ${error.message}` });
  }
});

router.put('/update-details', authMiddleware, async (req, res) => {
  try {
    const { shopName, businessAddress, gstNumber } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { shopName, businessAddress, gstNumber }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: `Update details error: ${error.message}` });
  }
});

router.post('/verify-again', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { verificationStatus: 'pending', rejectedReason: null }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

export default router;
