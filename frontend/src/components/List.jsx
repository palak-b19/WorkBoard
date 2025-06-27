import { useState } from 'react';
import { useDrop } from 'react-dnd';
import Task from './Task';
import { createTask } from '../services/api';

const List = ({ list, listIndex, moveTask, boardId, setBoard }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item, monitor) => {
      if (item.listId === list.id && item.index === list.tasks.length) {
        return;
      }
      moveTask(item, listIndex, list.tasks.length);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const validateInput = () => {
    const trimmedTitle = taskTitle.trim();

    if (!trimmedTitle) {
      setError('Task title is required');
      return false;
    }

    if (trimmedTitle.length > 100) {
      setError('Task title cannot exceed 100 characters');
      return false;
    }

    if (taskDescription && taskDescription.length > 500) {
      setError('Description cannot exceed 500 characters');
      return false;
    }

    if (taskDueDate) {
      const dueDate = new Date(taskDueDate);
      if (isNaN(dueDate.getTime())) {
        setError('Invalid due date format');
        return false;
      }
      if (dueDate <= new Date()) {
        setError('Due date must be in the future');
        return false;
      }
    }

    return true;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    if (!validateInput()) {
      setSubmitted(false);
      return;
    }

    // Create temporary task for optimistic update
    const tempId = `temp-${new Date().getTime()}`;
    const newTask = {
      _id: tempId, // Use _id format consistently
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      dueDate: taskDueDate ? new Date(taskDueDate) : undefined,
      createdAt: new Date(),
    };

    // Optimistically update UI
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === list.id ? { ...l, tasks: [...l.tasks, newTask] } : l
      ),
    }));

    setIsCreating(true);

    try {
      const response = await createTask(boardId, list.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        dueDate: taskDueDate || undefined,
      });

      console.log('Create task response:', response.data);

      // Get the newly created task from the response
      const newTaskFromResponse = response.data.lists
        .find((l) => l.id === list.id)
        ?.tasks.find((t) => t.title === taskTitle.trim());

      if (!newTaskFromResponse) {
        console.error('Could not find newly created task in response');
        return;
      }

      console.log('New task from response:', newTaskFromResponse);

      // Update board with the complete server response, ensuring tasks arrays are preserved
      setBoard((prevBoard) => {
        // First, create a map of existing tasks by list ID
        const existingTasksByList = {};
        prevBoard.lists.forEach((list) => {
          existingTasksByList[list.id] = Array.isArray(list.tasks)
            ? [...list.tasks]
            : [];
        });

        // Now create the new board state, merging in the new task
        const updatedBoard = {
          ...response.data,
          lists: response.data.lists.map((newList) => {
            const existingTasks = existingTasksByList[newList.id] || [];
            const newTasks = Array.isArray(newList.tasks) ? newList.tasks : [];

            // For the list that got the new task, use the server's tasks
            // For other lists, keep their existing tasks
            const tasks = newList.id === list.id ? newTasks : existingTasks;

            return {
              ...newList,
              tasks: [...tasks], // Create a new array to ensure state updates
            };
          }),
        };

        console.log('Previous board state:', prevBoard);
        console.log('Updated board state:', updatedBoard);
        return updatedBoard;
      });

      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setSubmitted(false);
      setError('');
    } catch (err) {
      console.error('Create task error:', err);

      // Revert optimistic update
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === list.id
            ? { ...l, tasks: l.tasks.filter((t) => t._id !== tempId) }
            : l
        ),
      }));

      setError(err.response?.data?.error || 'Failed to create task');
      setSubmitted(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      ref={drop}
      className={`bg-gray-100 p-4 rounded-lg w-1/3 min-h-[400px] ${
        isOver ? 'bg-gray-200 ring-2 ring-blue-300' : ''
      }`}
    >
      <h3 className="text-lg font-semibold mb-2">{list.title}</h3>

      {/* Task Creation Form */}
      <form onSubmit={handleCreateTask} className="mb-4">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter task title"
            className={`w-full p-2 border rounded-lg ${
              submitted && !taskTitle.trim()
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            disabled={isCreating}
          />

          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Enter task description (optional)"
            className="w-full p-2 border rounded-lg border-gray-300 resize-none"
            rows={3}
            disabled={isCreating}
          />

          <input
            type="date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            className="w-full p-2 border rounded-lg border-gray-300"
            min={new Date().toISOString().split('T')[0]}
            disabled={isCreating}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition ${
              isCreating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isCreating}
          >
            {isCreating ? 'Adding Task...' : 'Add Task'}
          </button>
        </div>
      </form>

      {/* Tasks Container */}
      <div className="min-h-[200px]">
        {list.tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks</p>
        ) : (
          list.tasks.map((task, taskIndex) => (
            <Task
              key={task._id}
              task={task}
              index={taskIndex}
              listId={list.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default List;
