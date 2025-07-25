import { useDrag } from 'react-dnd';
import { useState } from 'react';
import { updateTask, getBoardById, deleteTask } from '../services/api';

const Task = ({ task, index, listId, boardId, setBoard, highlightTerm }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'TASK',
      item: {
        id: task._id || task.id,
        index,
        listId,
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [task._id, task.id, index, listId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const renderHighlight = (text) => {
    if (!highlightTerm) return text;
    const regex = new RegExp(`(${highlightTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const validate = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return false;
    }
    if (trimmedTitle.length > 100) {
      setError('Title cannot exceed 100 characters');
      return false;
    }
    if (description && description.length > 500) {
      setError('Description cannot exceed 500 characters');
      return false;
    }
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        setError('Invalid due date');
        return false;
      }
      if (d <= new Date()) {
        setError('Due date must be in the future');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await updateTask(boardId, task._id || task.id, listId, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
      });

      // Fetch fresh board state
      const res = await getBoardById(boardId);
      setBoard(res.data);

      setIsEditing(false);
    } catch (err) {
      console.error('Update task error', err);
      setError(err.response?.data?.error || 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteTask(boardId, task._id || task.id);

      // Refresh board state
      const res = await getBoardById(boardId);
      setBoard(res.data);
    } catch (err) {
      console.error('Delete task error', err);
      setDeleteError(err.response?.data?.error || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && listId !== 'done';

  if (isEditing) {
    return (
      <div className="bg-white p-4 mb-2 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded"
            disabled={isSubmitting}
            data-cy="task-title-input"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border rounded"
            rows={3}
            disabled={isSubmitting}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="p-2 border rounded"
            min={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
              disabled={isSubmitting}
              data-cy="save-task"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 px-3 py-1 rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      ref={drag}
      className={`bg-white p-4 mb-2 rounded-lg shadow-md cursor-pointer transition-opacity duration-300 fade-in ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border border-red-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold break-words max-w-[80%]">
          {renderHighlight(task.title)}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 hover:underline"
            data-cy="edit-task"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 hover:underline"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-gray-600 text-sm mb-1 break-words">
          {renderHighlight(task.description)}
        </p>
      )}
      {task.dueDate && (
        <p className="text-gray-500 text-xs flex items-center gap-1">
          Due: {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && (
            <span
              className="text-red-600 font-semibold ml-1"
              aria-label="Overdue task"
            >
              • Overdue
            </span>
          )}
        </p>
      )}
      {deleteError && (
        <p className="text-red-500 text-xs mb-1">{deleteError}</p>
      )}
    </div>
  );
};

export default Task;
