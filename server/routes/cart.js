import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID required' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.cart) {
      user.cart = [];
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive || product.verificationStatus !== 'approved') {
      return res.status(400).json({ message: 'Product not available' });
    }

    const existingItem = user.cart.find(item => item.product?.toString() === productId.toString());

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: product._id, quantity });
    }

    await user.save();
    res.json({ message: 'Product added to cart', cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: `Add to cart failed: ${error.message}` });
  }
});

router.get('/get', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('cart.product');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: `Failed to fetch cart: ${error.message}` });
  }
});

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const item = user.cart.find(item => item.product?.toString() === productId);
    if (item) {
      item.quantity = quantity;
      await user.save();
    }
    res.json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: `Update cart failed: ${error.message}` });
  }
});

router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.cart = user.cart.filter(item => item.product?.toString() !== req.params.productId);
    await user.save();
    res.json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: `Remove from cart failed: ${error.message}` });
  }
});

export default router;
