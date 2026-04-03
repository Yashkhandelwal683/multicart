import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = await User.findOne({ email });
      if (adminUser) {
        const token = jwt.sign(
          { id: adminUser._id, email: adminUser.email, name: adminUser.name, role: 'admin' },
          process.env.AUTH_SECRET || process.env.JWT_SECRET,
          { expiresIn: '10d' }
        );
        return res.json({ 
          user: { id: adminUser._id, email: adminUser.email, name: adminUser.name, role: 'admin' },
          token 
        });
      }
      const token = jwt.sign(
        { id: 'admin-fixed', email: ADMIN_EMAIL, name: 'Admin', role: 'admin' },
        process.env.AUTH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '10d' }
      );
      return res.json({ 
        user: { id: 'admin-fixed', email: ADMIN_EMAIL, name: 'Admin', role: 'admin' },
        token 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect Password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '10d' }
    );

    res.json({ 
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    res.status(500).json({ message: `Login error: ${error.message}` });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: 'User already exist' });
    }

    if (isAdmin) {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(403).json({ message: 'Admin already exists. Only one admin is allowed.' });
      }
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be atleast six characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: isAdmin ? 'admin' : 'user'
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: `register error ${error.message}` });
  }
});

export default router;
