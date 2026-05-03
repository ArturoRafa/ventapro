import { Errors } from '../utils/AppError';

export interface LoginDto {
  email: string;
  password: string;
}

export function validateLoginDto(body: Record<string, unknown>): LoginDto {
  const { email, password } = body;

  if (!email || typeof email !== 'string') {
    throw Errors.validation('Email is required');
  }
  if (!password || typeof password !== 'string') {
    throw Errors.validation('Password is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw Errors.validation('Invalid email format');
  }

  return { email: email.trim().toLowerCase(), password };
}
