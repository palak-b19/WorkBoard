import { useDrag } from 'react-dnd';

const Task = ({ task, index, listId }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, index, listId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white p-2 mb-2 rounded shadow ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } cursor-move`}
    >
      {task.title}
    </div>
  );
};

export default Task;
