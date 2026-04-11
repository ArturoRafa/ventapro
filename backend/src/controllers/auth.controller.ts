import { Request, Response, NextFunction } from 'express';

import { validateLoginDto } from '../dtos/auth.dto';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateLoginDto(req.body);
    const result = await authService.login(dto);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
