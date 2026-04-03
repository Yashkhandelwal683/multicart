import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/all-products-data', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('vendor', 'name email shopName')
      .populate({ path: 'reviews.user', select: 'name email image' })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

router.post('/add-review', async (req, res) => {
  try {
    const { productId, userId, rating, comment, image } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.reviews.push({ user: userId, rating, comment, image });
    await product.save();

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

export default router;
