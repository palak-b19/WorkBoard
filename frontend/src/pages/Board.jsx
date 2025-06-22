import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Header from '../components/Header';
import Footer from '../components/Footer';
import List from '../components/List';
import { getBoardById, updateBoard } from '../services/api';

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

  const moveTask = async (item, toListIndex, toTaskIndex) => {
    if (!board) return;
    const { id: taskId, listId: fromListId, index: fromTaskIndex } = item;
    const fromListIndex = board.lists.findIndex(
      (list) => list.id === fromListId
    );

    // Create new lists array
    const newLists = [...board.lists];
    const fromList = { ...newLists[fromListIndex] };
    const toList = { ...newLists[toListIndex] };

    // Remove task from source list
    const [task] = fromList.tasks.splice(fromTaskIndex, 1);

    // Add task to destination list
    toList.tasks.splice(toTaskIndex, 0, task);

    // Update lists
    newLists[fromListIndex] = fromList;
    newLists[toListIndex] = toList;

    // Update state and API
    setBoard({ ...board, lists: newLists });
    try {
      await updateBoard(id, newLists);
    } catch (err) {
      setError('Failed to update board');
      // Revert state on error
      fetchBoard();
    }
  };

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
            {board.lists.map((list, listIndex) => (
              <List
                key={list.id}
                list={list}
                listIndex={listIndex}
                moveTask={moveTask}
              />
            ))}
          </div>
        </DndProvider>
      </main>
      <Footer />
    </div>
  );
}
