import { Request, Response, NextFunction } from 'express';

import * as userService from '../services/user.service';

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.getAll();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
}
