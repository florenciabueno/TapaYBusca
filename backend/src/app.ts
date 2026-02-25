import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './modules/auth/routes/auth.routes';
import equationRoutes from './modules/equations/routes/equation.routes';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/equations', equationRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 Endpoint de login: http://localhost:${PORT}/api/auth/login`);
});

// Manejo de errores del servidor
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
  } else {
    console.error('❌ Error al iniciar el servidor:', error);
  }
  process.exit(1);
});

export default app;
