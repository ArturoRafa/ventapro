import { Request, Response, NextFunction } from 'express';

import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  // Unhandled error — always log server-side
  console.error('Unhandled error:', err);

  // In production, hide internal details from the client
  const body: Record<string, unknown> = {
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
  if (!env.isProduction) {
    body.error = err.message;
    body.stack = err.stack;
  }

  res.status(500).json(body);
}
