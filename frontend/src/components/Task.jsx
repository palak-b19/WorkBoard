import { useDrag } from 'react-dnd';

const Task = ({ task, index, listId }) => {
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
      className={`bg-white p-4 mb-2 rounded-lg shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <h4 className="font-semibold mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-gray-600 text-sm mb-2">{task.description}</p>
      )}
      {task.dueDate && (
        <p className="text-gray-500 text-xs">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default Task;
