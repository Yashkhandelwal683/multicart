import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { initializeSocket } from './config/socket.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import vendorRoutes from './routes/vendor.js';
import productRoutes from './routes/product.js';
import searchRoutes from './routes/search.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/product', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Multicart API is running' });
});

const PORT = process.env.PORT || 5000;
const server = createServer(app);

global.io = initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
