import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AppDataSource } from '../config/database';
import { env } from '../config/env';
import { User } from '../entities/User';
import { LoginDto } from '../dtos/auth.dto';
import { Errors } from '../utils/AppError';

interface LoginResult {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export async function login(dto: LoginDto): Promise<LoginResult> {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({
    where: { email: dto.email, status: 'activo' },
  });

  if (!user) {
    throw Errors.invalidCredentials();
  }

  const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isMatch) {
    throw Errors.invalidCredentials();
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as string & jwt.SignOptions['expiresIn'],
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
