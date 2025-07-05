import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Task from '../components/Task';
import React from 'react';

jest.mock('../services/api', () => ({
  updateTask: jest.fn(),
  getBoardById: jest.fn().mockResolvedValue({ data: { lists: [] } }),
  deleteTask: jest.fn(),
}));

import { deleteTask } from '../services/api';

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
});
