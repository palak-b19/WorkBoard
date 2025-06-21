import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getBoardById } from '../services/api';

export default function Board() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await getBoardById(id);
        setBoard(response.data);
      } catch (err) {
        setError('Failed to fetch board');
      }
    };
    fetchBoard();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow p-4">
          <p className="text-red-500">{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow p-4">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-2xl font-bold mb-4">{board.title}</h2>
        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-4">
            {board.lists.map((list) => (
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
