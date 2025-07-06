import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock the entire API module
jest.mock('../services/api', () => ({
  getBoards: jest.fn(),
  getAnalytics: jest.fn(),
  createBoard: jest.fn(),
  deleteBoard: jest.fn(),
}));

import { getBoards, getAnalytics, deleteBoard } from '../services/api';

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBoards.mockResolvedValue({
      data: [{ _id: '1', title: 'Board 1', createdAt: '2025-07-01T00:00:00Z' }],
    });
    getAnalytics.mockResolvedValue({
      data: { totalTasks: 10, completedTasks: 4, overdueTasks: 1 },
    });
  });

  const renderDashboard = () =>
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

  it('renders analytics values', async () => {
    renderDashboard();

    // Wait until analytics are displayed
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('deletes board successfully after confirmation', async () => {
    window.confirm = jest.fn(() => true);
    deleteBoard.mockResolvedValue({});

    renderDashboard();

    // Ensure board is rendered first
    await screen.findByText('Board 1');

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteBoard).toHaveBeenCalledWith('1');
    });
  });

  it('shows error message when delete fails', async () => {
    window.confirm = jest.fn(() => true);
    deleteBoard.mockRejectedValue({ response: { status: 500 } });

    renderDashboard();

    await screen.findByText('Board 1');

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to delete board/i)).toBeInTheDocument();
    });
  });
});
