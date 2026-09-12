import cors from 'cors';
import express from 'express';
import * as helmetModule from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/not-found.middleware.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import healthRoutes from './routes/health.routes.js';
import messageRoutes from './routes/message.routes.js';
import locationRoutes from './routes/location.routes.js';
import propertyRoutes from './routes/property.routes.js';

const helmetFactory = (
  (helmetModule as unknown as { default?: unknown }).default ?? helmetModule
) as unknown as () => import('express').RequestHandler;

export const app = express();

app.disable('x-powered-by');
app.use(helmetFactory());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDirectory), { index: false }));

app.get('/', (_request, response) => {
  response.json({
    success: true,
    message: 'Welcome to the Maskank API'
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/properties', propertyRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
