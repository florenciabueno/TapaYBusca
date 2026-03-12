import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import equationRoutes from './modules/equations/equation.routes.js';

const app = express();

// Middleware: CORS usa FRONTEND_BASE_URL (en Render: tu URL de Vercel)
app.use(cors({
  origin: config.frontendBaseUrl,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/equations', equationRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

export default app;
