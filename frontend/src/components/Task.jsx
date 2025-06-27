import { useDrag } from 'react-dnd';

const Task = ({ task, index, listId }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: {
      id: task._id || task.id, // Handle both MongoDB ObjectId and temporary id
      index,
      listId,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={drag}
      className={`bg-white p-3 mb-2 rounded-lg shadow-sm border cursor-move ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <h4 className="font-medium text-gray-800">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
      )}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
        {task.createdAt && <span>Created: {formatDate(task.createdAt)}</span>}
      </div>
    </div>
  );
};

export default Task;
