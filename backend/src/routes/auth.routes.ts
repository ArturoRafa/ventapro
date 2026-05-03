import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import * as authController from '../controllers/auth.controller';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    code: 'TOO_MANY_REQUESTS',
    message: 'Demasiados intentos de login. Intente de nuevo en 15 minutos.',
  },
});

const router = Router();

router.post('/login', loginLimiter, authController.login);

export default router;
