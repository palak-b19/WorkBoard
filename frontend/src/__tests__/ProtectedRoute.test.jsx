import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

jest.mock('../services/api', () => ({
  default: {
    get: jest.fn(),
  },
}));

import api from '../services/api';

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
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login for unauthenticated', async () => {
    api.get.mockRejectedValueOnce({});

    render(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).toBeNull();
    });
  });
});
