import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock react-dnd to avoid ESM parsing & backend context errors
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
}));

// Replace previous API mock with minimal stubs to avoid import.meta parsing
jest.mock('../services/api', () => ({
  updateTask: jest.fn(),
  createTask: jest.fn(),
  getBoardById: jest.fn().mockResolvedValue({ data: { lists: [] } }),
  deleteTask: jest.fn(),
}));

// Update imports accordingly
import {
  updateTask,
  createTask,
  deleteTask,
  getBoardById,
} from '../services/api';

import Task from '../components/Task';

describe('Task component', () => {
  const mockSetBoard = jest.fn();
  const task = {
    _id: 'task1',
    title: 'Test Task',
    description: 'Some description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls deleteTask after confirmation', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <Task
        task={task}
        index={0}
        listId="todo"
        boardId="board1"
        setBoard={mockSetBoard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith('board1', 'task1');
    });
  });

  it('updates a task title when saved', async () => {
    updateTask.mockResolvedValueOnce({});
    const updatedBoard = { lists: [] };
    getBoardById.mockResolvedValueOnce({ data: updatedBoard });

    render(
      <Task
        task={task}
        index={0}
        listId="todo"
        boardId="board1"
        setBoard={mockSetBoard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const [titleInput] = screen.getAllByRole('textbox');
    fireEvent.change(titleInput, {
      target: { value: 'Updated Task Title' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('board1', 'task1', 'todo', {
        title: 'Updated Task Title',
        description: 'Some description',
        dueDate: undefined,
      });
    });
  });

  it('shows validation error on empty title during edit', async () => {
    render(
      <Task
        task={task}
        index={0}
        listId="todo"
        boardId="board1"
        setBoard={mockSetBoard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const [titleInput] = screen.getAllByRole('textbox');
    fireEvent.change(titleInput, {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Expect an inline validation error
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });
});
