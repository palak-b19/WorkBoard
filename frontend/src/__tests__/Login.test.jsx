import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock login API
jest.mock('../services/api', () => ({
  login: jest.fn(),
}));

import { login } from '../services/api';
import Login from '../pages/Login';
import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('Login page', () => {
  it('renders form fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('successful login stores token and redirects', async () => {
    login.mockResolvedValueOnce({ data: { token: 'fake-jwt' } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(localStorage.getItem('token')).toBe('fake-jwt');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error on invalid credentials', async () => {
    login.mockRejectedValueOnce({ response: { status: 401 } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
  });
});
