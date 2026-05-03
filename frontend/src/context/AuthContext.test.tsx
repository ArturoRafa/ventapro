import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/auth.service', () => ({
  login: vi.fn(),
}));

import * as authService from '../services/auth.service';

function futureExp() {
  return Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
}

function pastExp() {
  return Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
}

function makeToken(exp: number) {
  const payload = btoa(JSON.stringify({ id: 1, email: 'test@test.com', role: 'admin', exp }));
  return `header.${payload}.sig`;
}

const validToken = makeToken(futureExp());
const expiredToken = makeToken(pastExp());
const mockUser = { id: 1, name: 'Test User', email: 'test@test.com', role: 'admin' as const };

function TestConsumer() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  describe('initial load from localStorage', () => {
    it('should restore session when stored token is valid', async () => {
      localStorage.setItem('token', validToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      render(<AuthProvider><TestConsumer /></AuthProvider>);

      await waitFor(() => {
        expect(screen.getByTestId('auth').textContent).toBe('yes');
        expect(screen.getByTestId('user').textContent).toBe('test@test.com');
      });
    });

    it('should not restore session when stored token is expired', async () => {
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      render(<AuthProvider><TestConsumer /></AuthProvider>);

      await waitFor(() => {
        expect(screen.getByTestId('auth').textContent).toBe('no');
        expect(screen.getByTestId('user').textContent).toBe('none');
      });
    });

    it('should clear localStorage when token is expired', async () => {
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      render(<AuthProvider><TestConsumer /></AuthProvider>);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
      });
    });

    it('should start unauthenticated when localStorage is empty', async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);

      await waitFor(() => {
        expect(screen.getByTestId('auth').textContent).toBe('no');
      });
    });
  });

  describe('login', () => {
    it('should set user and token after successful login', async () => {
      (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        token: validToken,
        user: mockUser,
      });

      function LoginTrigger() {
        const { login, isAuthenticated, user } = useAuth();
        return (
          <div>
            <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
            <span data-testid="user">{user?.email ?? 'none'}</span>
            <button onClick={() => login({ email: 'test@test.com', password: 'pass' })}>
              Login
            </button>
          </div>
        );
      }

      render(<AuthProvider><LoginTrigger /></AuthProvider>);
      expect(screen.getByTestId('auth').textContent).toBe('no');

      await act(async () => {
        screen.getByRole('button').click();
      });

      expect(screen.getByTestId('auth').textContent).toBe('yes');
      expect(screen.getByTestId('user').textContent).toBe('test@test.com');
      expect(localStorage.getItem('token')).toBe(validToken);
    });
  });

  describe('logout', () => {
    it('should clear user, token, and localStorage', async () => {
      localStorage.setItem('token', validToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      function LogoutTrigger() {
        const { logout, isAuthenticated } = useAuth();
        return (
          <div>
            <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
            <button onClick={logout}>Logout</button>
          </div>
        );
      }

      render(<AuthProvider><LogoutTrigger /></AuthProvider>);

      await waitFor(() => {
        expect(screen.getByTestId('auth').textContent).toBe('yes');
      });

      act(() => {
        screen.getByRole('button').click();
      });

      expect(screen.getByTestId('auth').textContent).toBe('no');
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('useAuth', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestConsumer />)).toThrow();
      consoleSpy.mockRestore();
    });
  });
});
