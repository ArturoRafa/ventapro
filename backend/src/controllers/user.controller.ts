import { Request, Response, NextFunction } from 'express';

import * as userService from '../services/user.service';
import { validateCreateUserDto, validateUpdateUserDto } from '../dtos/user.dto';

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.getAll();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCreateUserDto(req.body as Record<string, unknown>);
    const user = await userService.create(dto);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const dto = validateUpdateUserDto(req.body as Record<string, unknown>);
    const user = await userService.update(id, dto);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const requesterId = req.user!.id;
    const user = await userService.toggleStatus(id, requesterId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}
