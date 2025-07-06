import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Replace react-dnd mock earlier remains from import; ensure we also export stub
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

// Refactor API mock to not call requireActual
jest.mock('../services/api', () => ({
  createTask: jest.fn(),
  getBoardById: jest.fn(),
}));

import { createTask, getBoardById } from '../services/api';

// List component import is placed after mocks to ensure they are active
import List from '../components/List';

describe('List component – task creation', () => {
  const mockSetBoard = jest.fn();
  const sampleList = { id: 'todo', title: 'To Do', tasks: [] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls createTask and getBoardById on valid submission', async () => {
    createTask.mockResolvedValueOnce({ data: {} });
    getBoardById.mockResolvedValueOnce({
      data: {
        lists: [
          {
            id: 'todo',
            title: 'To Do',
            tasks: [{ _id: '1', title: 'New Task' }],
          },
        ],
      },
    });

    render(
      <List
        list={sampleList}
        listIndex={0}
        moveTask={jest.fn()}
        boardId="board1"
        setBoard={mockSetBoard}
      />
    );

    // Enter a task title
    fireEvent.change(screen.getByPlaceholderText('Enter task title'), {
      target: { value: 'New Task' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith('board1', 'todo', {
        title: 'New Task',
        description: undefined,
        dueDate: undefined,
      });
      expect(getBoardById).toHaveBeenCalledWith('board1');
      expect(mockSetBoard).toHaveBeenCalled();
    });
  });

  it('shows validation error when title is empty', async () => {
    render(
      <List
        list={sampleList}
        listIndex={0}
        moveTask={jest.fn()}
        boardId="board1"
        setBoard={mockSetBoard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    // Error message should appear
    expect(
      await screen.findByText(/task title is required/i)
    ).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });
});
