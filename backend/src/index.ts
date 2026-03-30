import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import healthRoutes from './routes/health.routes';
import verificationRoutes from './routes/verification.routes';
import { globalErrorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/v1/verify', verificationRoutes);

// Base route
app.get('/', (req: Request, res: Response) => {
  res.send('StellarProof Backend API is running');
});

// Global error handler — must be registered last
app.use(globalErrorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
