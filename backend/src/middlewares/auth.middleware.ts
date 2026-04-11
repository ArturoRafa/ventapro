import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { Errors } from '../utils/AppError';

interface JwtPayload {
  id: number;
  email: string;
  role: 'admin' | 'cashier';
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw Errors.unauthorized('Token not provided');
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    throw Errors.unauthorized('Invalid or expired token');
  }
}

export function authorize(...roles: Array<'admin' | 'cashier'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw Errors.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw Errors.forbidden('Insufficient permissions');
    }
    next();
  };
}
