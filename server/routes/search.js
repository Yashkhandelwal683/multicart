import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { query, category, shop, minPrice, maxPrice, minRating } = req.query;

    const filter = { isActive: true, verificationStatus: 'approved' };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (shop && shop !== 'all') {
      filter.vendor = shop;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter['reviews.rating'] = { $gte: Number(minRating) };
    }

    const products = await Product.find(filter)
      .populate('vendor', 'shopName image')
      .populate('reviews.user', 'name image')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
