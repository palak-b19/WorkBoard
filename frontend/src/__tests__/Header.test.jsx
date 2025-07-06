import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Header from '../components/Header';
import { MemoryRouter } from 'react-router-dom';

// Mock navigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock api default export
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import api from '../services/api';

describe('Header component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('shows Login link when user is not authenticated', async () => {
    // Simulate backend validation failure
    api.default.get.mockRejectedValueOnce({});

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Wait for auth check to finish and expect Login link
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });
  });

  it('shows Logout button when user is authenticated', async () => {
    localStorage.setItem('token', 'jwt');
    api.default.get.mockResolvedValueOnce({ status: 200 });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i })
      ).toBeInTheDocument();
    });
  });

  it('logout removes token and navigates to /login', async () => {
    localStorage.setItem('token', 'jwt');
    api.default.get.mockResolvedValueOnce({ status: 200 });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByRole('button', { name: /logout/i }));

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    // After logout button clicked, Login link should eventually appear
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });
  });
});
