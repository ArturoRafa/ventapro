import { Request, Response, NextFunction } from 'express';

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

  // Unhandled error → log + generic response
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
