import { Request, Response, NextFunction } from 'express';

import * as configService from '../services/config.service';
import { validateUpdateConfigDto } from '../dtos/config.dto';

export async function get(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await configService.getConfig();
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateUpdateConfigDto(req.body);
    const config = await configService.updateConfig(dto);
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
}
