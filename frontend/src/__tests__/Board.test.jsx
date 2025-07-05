import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mock react-dnd to avoid backend context errors
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));
jest.mock('react-dnd-html5-backend', () => ({}));

jest.mock('../services/api', () => ({
  getBoardById: jest.fn(),
  updateBoard: jest.fn(),
}));

import { getBoardById } from '../services/api';
import Board from '../pages/Board';

const sampleBoard = {
  _id: 'board123',
  title: 'Demo Board',
  lists: [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { _id: '1', title: 'Urgent task', description: 'needs doing' },
        { _id: '2', title: 'Refactor code', description: 'cleanup' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [{ _id: '3', title: 'Review PR', description: 'urgent review' }],
    },
  ],
};

describe('Board search filter', () => {
  beforeEach(() => {
    getBoardById.mockResolvedValue({ data: sampleBoard });
  });

  it('filters tasks based on search query', async () => {
    render(
      <MemoryRouter initialEntries={[`/board/${sampleBoard._id}`]}>
        <Routes>
          <Route path="/board/:id" element={<Board />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for tasks to load
    await waitFor(() => screen.getByText('Urgent task'));

    // Type search query
    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), {
      target: { value: 'urgent' },
    });

    // Only tasks containing 'urgent' should be visible
    expect(screen.getByText('Urgent task')).toBeInTheDocument();
    expect(screen.getByText('Review PR')).toBeInTheDocument();
    expect(screen.queryByText('Refactor code')).toBeNull();
  });
});
