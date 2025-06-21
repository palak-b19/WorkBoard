import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Board() {
  const [lists, setLists] = useState([
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'inprogress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-2xl font-bold mb-4">Kanban Board</h2>
        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-4">
            {lists.map((list) => (
              <div key={list.id} className="bg-gray-100 p-4 rounded-lg w-1/3">
                <h3 className="text-lg font-semibold mb-2">{list.title}</h3>
                <div className="min-h-[200px]">
                  {list.tasks.length === 0 ? (
                    <p className="text-gray-500">No tasks</p>
                  ) : (
                    list.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white p-2 mb-2 rounded shadow"
                      >
                        {task.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </DndProvider>
      </main>
      <Footer />
    </div>
  );
}
