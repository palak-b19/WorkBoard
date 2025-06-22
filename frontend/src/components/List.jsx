import { useState } from 'react';
import { useDrop } from 'react-dnd';
import Task from './Task';
import { createTask } from '../services/api';

const List = ({ list, listIndex, moveTask, boardId, setBoard }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item) => moveTask(item, listIndex, list.tasks.length),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!taskTitle) return;
    try {
      const task = { title: taskTitle };
      const response = await createTask(boardId, list.id, task);
      setBoard(response.data);
      setTaskTitle('');
      setSubmitted(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  return (
    <div
      ref={drop}
      className={`bg-gray-100 p-4 rounded-lg w-1/3 ${
        isOver ? 'bg-gray-200' : ''
      }`}
    >
      <h3 className="text-lg font-semibold mb-2">{list.title}</h3>
      <form onSubmit={handleCreateTask} className="mb-4">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter task title"
            className={`w-full p-2 border rounded-lg ${
              submitted && !taskTitle ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {submitted && !taskTitle && (
            <p className="text-red-500 text-sm">Title is required</p>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Add Task
          </button>
        </div>
      </form>
      <div className="min-h-[200px]">
        {list.tasks.length === 0 ? (
          <p className="text-gray-500">No tasks</p>
        ) : (
          list.tasks.map((task, taskIndex) => (
            <Task
              key={task.id}
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
