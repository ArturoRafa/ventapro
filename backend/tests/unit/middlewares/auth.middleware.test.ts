import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('@/config/env', () => ({
  env: { jwtSecret: 'test-secret' },
}));

import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { AppError } from '@/utils/AppError';

function createMockReqResNext(headers: Record<string, string> = {}, user?: Record<string, unknown>) {
  const req = {
    headers,
    user,
  } as unknown as import('express').Request;
  const res = {} as import('express').Response;
  const next = jest.fn();
  return { req, res, next };
}

describe('authenticate', () => {
  it('should set req.user and call next() on valid token', () => {
    const payload = { id: 1, email: 'test@test.com', role: 'admin' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const { req, res, next } = createMockReqResNext({ authorization: 'Bearer valid-token' });

    authenticate(req, res, next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with error when no Authorization header', () => {
    const { req, res, next } = createMockReqResNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toContain('Token not provided');
  });

  it('should call next with error when header lacks Bearer prefix', () => {
    const { req, res, next } = createMockReqResNext({ authorization: 'Basic abc123' });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next with error when token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });
    const { req, res, next } = createMockReqResNext({ authorization: 'Bearer bad-token' });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.message).toContain('Invalid or expired token');
  });
});

describe('authorize', () => {
  it('should call next() when user has allowed role', () => {
    const { req, res, next } = createMockReqResNext({}, { id: 1, email: 'a@b.com', role: 'admin' });
    const middleware = authorize('admin');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with FORBIDDEN when user role not in allowed list', () => {
    const { req, res, next } = createMockReqResNext({}, { id: 1, email: 'a@b.com', role: 'cashier' });
    const middleware = authorize('admin');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should call next with UNAUTHORIZED when no user on request', () => {
    const { req, res, next } = createMockReqResNext();
    const middleware = authorize('admin');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should accept user when role matches one of multiple allowed roles', () => {
    const { req, res, next } = createMockReqResNext({}, { id: 1, email: 'a@b.com', role: 'cashier' });
    const middleware = authorize('admin', 'cashier');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
