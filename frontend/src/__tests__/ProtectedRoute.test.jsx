import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import api from '../services/api';
import { MemoryRouter } from 'react-router-dom';

const TestChild = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders children for authenticated user', async () => {
    localStorage.setItem('token', 'jwt');
    api.get.mockResolvedValueOnce({ status: 200 });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login for unauthenticated', async () => {
    api.get.mockRejectedValueOnce({});

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).toBeNull();
    });
  });
});
