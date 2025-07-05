import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mock react-dnd to avoid backend context errors
// Replace react-dnd mock with internal scoped callbacks to satisfy jest constraints
jest.mock('react-dnd', () => {
  const dropCallbacks = [];
  const DndProvider = ({ children }) => children;
  return {
    useDrag: () => [{ isDragging: false }, jest.fn()],
    useDrop: (specGenerator) => {
      const spec = specGenerator();
      if (spec && typeof spec.drop === 'function') {
        dropCallbacks.push(spec.drop);
      }
      return [{ isOver: false }, jest.fn()];
    },
    DndProvider,
    // expose helper to tests
    __getDropCallbacks: () => dropCallbacks,
  };
});

jest.mock('react-dnd-html5-backend', () => ({ HTML5Backend: {} }));

jest.mock('../services/api', () => ({
  getBoardById: jest.fn(),
  updateBoard: jest.fn(),
}));

import { getBoardById, updateBoard } from '../services/api';
import Board from '../pages/Board';
import * as dnd from 'react-dnd';

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

describe('Board drag and drop', () => {
  beforeEach(() => {
    getBoardById.mockResolvedValue({ data: sampleBoard });
  });

  it('calls updateBoard after moving a task between lists', async () => {
    render(
      <MemoryRouter initialEntries={[`/board/${sampleBoard._id}`]}>
        <Routes>
          <Route path="/board/:id" element={<Board />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait until board data is rendered
    await waitFor(() => screen.getByText('Urgent task'));

    // Retrieve captured drop callbacks from mock
    const callbacks = dnd.__getDropCallbacks();
    expect(callbacks.length).toBeGreaterThan(1);

    const item = { id: '1', index: 0, listId: 'todo' };

    await act(async () => {
      callbacks[1](item, {});
    });

    await waitFor(() => {
      expect(updateBoard).toHaveBeenCalled();
    });
  });
});
