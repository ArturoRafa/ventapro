import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

import { env } from './config/env';
import { AppDataSource } from './config/database';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import configRoutes from './routes/config.routes';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import customerRoutes from './routes/customer.routes';
import cashRegisterRoutes from './routes/cash-register.routes';
import saleRoutes from './routes/sale.routes';
import creditRoutes from './routes/credit.routes';

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/configuracion', configRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/subcategorias', subcategoryRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/inventario', inventoryRoutes);
app.use('/api/clientes', customerRoutes);
app.use('/api/cajas', cashRegisterRoutes);
app.use('/api/ventas', saleRoutes);
app.use('/api/creditos', creditRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.warn(`Database connected successfully`);

    app.listen(env.port, () => {
      console.warn(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
