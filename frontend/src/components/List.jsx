import { useDrop } from 'react-dnd';
import Task from './Task';

const List = ({ list, listIndex, moveTask }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item) => moveTask(item, listIndex, list.tasks.length),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`bg-gray-100 p-4 rounded-lg w-1/3 ${
        isOver ? 'bg-gray-200' : ''
      }`}
    >
      <h3 className="text-lg font-semibold mb-2">{list.title}</h3>
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
