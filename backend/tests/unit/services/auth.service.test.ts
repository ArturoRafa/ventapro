import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/config/env', () => ({
  env: { jwtSecret: 'test-secret', jwtExpiresIn: '1h' },
}));
jest.mock('@/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '@/config/database';
import { login } from '@/services/auth.service';
import { AppError } from '@/utils/AppError';
import { buildUser } from '../../helpers/fixtures';

const mockUserRepo = {
  findOne: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);
});

describe('auth.service login', () => {
  const dto = { email: 'test@example.com', password: 'password123' };

  it('should return token and user on success', async () => {
    const user = buildUser();
    mockUserRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock-token');

    const result = await login(dto);

    expect(result.token).toBe('mock-token');
    expect(result.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });

  it('should query for active user by email', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(login(dto)).rejects.toThrow(AppError);
    expect(mockUserRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email, status: 'activo' },
    });
  });

  it('should throw invalidCredentials when user not found', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    await expect(login(dto)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('should throw invalidCredentials when password is wrong', async () => {
    mockUserRepo.findOne.mockResolvedValue(buildUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login(dto)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('should sign JWT with correct payload and options', async () => {
    const user = buildUser({ id: 5, email: 'u@test.com', role: 'admin' });
    mockUserRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('tok');

    await login(dto);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 5, email: 'u@test.com', role: 'admin' },
      'test-secret',
      { expiresIn: '1h' },
    );
  });
});
