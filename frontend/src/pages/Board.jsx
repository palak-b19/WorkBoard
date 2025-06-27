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

  const fetchBoard = async () => {
    try {
      const response = await getBoardById(id);
      setBoard(response.data);
    } catch (err) {
      setError('Failed to fetch board');
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [id]);

  const moveTask = async (item, toListIndex, toTaskIndex) => {
    if (!board) return;

    console.log('Moving task:', item);
    console.log('Current board state:', board);

    const { id: taskId, listId: fromListId, index: fromTaskIndex } = item;

    // Find the source list index
    const fromListIndex = board.lists.findIndex(
      (list) => list.id === fromListId
    );

    if (fromListIndex === -1) {
      console.error('Source list not found:', fromListId);
      return;
    }

    // Validate target list index
    if (toListIndex < 0 || toListIndex >= board.lists.length) {
      console.error('Invalid target list index:', toListIndex);
      return;
    }

    // Find the actual task being moved using the taskId
    const sourceList = board.lists[fromListIndex];
    console.log('Source list tasks:', sourceList.tasks);
    console.log('Looking for task with ID:', taskId);

    const taskToMove = sourceList.tasks.find((task) => {
      const taskIdStr = task._id?.toString() || task.id?.toString();
      const searchIdStr = taskId?.toString();
      console.log(
        'Comparing task ID:',
        taskIdStr,
        'with search ID:',
        searchIdStr
      );
      return taskIdStr === searchIdStr;
    });

    if (!taskToMove) {
      console.error('Task not found:', taskId);
      console.error(
        'Available task IDs:',
        sourceList.tasks.map((t) => t._id || t.id)
      );
      return;
    }

    // If this is a temporary task (created but not yet saved), don't try to sync with backend
    const isTemporaryTask = (taskToMove._id?.toString() || '').startsWith(
      'temp-'
    );

    console.log('Found task to move:', taskToMove);

    // Create deep copies of the lists to avoid mutation
    const newLists = board.lists.map((list) => ({
      ...list,
      tasks: list.tasks.map((task) => ({
        ...task,
        // Ensure we preserve the MongoDB _id format
        _id: task._id || task.id,
      })),
    }));

    // Remove task from source list
    newLists[fromListIndex].tasks = newLists[fromListIndex].tasks.filter(
      (task) => (task._id || task.id) !== taskId
    );

    // Add task to destination list at the specified position
    const actualToIndex = Math.min(
      toTaskIndex,
      newLists[toListIndex].tasks.length
    );

    // Ensure the task we're inserting uses _id
    const taskToInsert = {
      ...taskToMove,
      _id: taskToMove._id || taskToMove.id,
    };

    newLists[toListIndex].tasks.splice(actualToIndex, 0, taskToInsert);

    console.log('Updated lists:', newLists);

    // Update local state immediately for responsive UI
    const updatedBoard = { ...board, lists: newLists };
    setBoard(updatedBoard);

    // Don't try to sync with backend if this is a temporary task
    if (isTemporaryTask) {
      console.log('Skipping backend sync for temporary task');
      return;
    }

    try {
      // Prepare lists for backend by ensuring all tasks use _id
      const listsForBackend = newLists.map((list) => ({
        ...list,
        tasks: list.tasks
          .map((task) => {
            // Skip temporary tasks when sending to backend
            if (task._id?.toString().startsWith('temp-')) {
              return null;
            }
            return {
              ...task,
              _id: task._id || task.id,
              // Remove any temporary id field
              id: undefined,
            };
          })
          .filter(Boolean), // Remove null tasks
      }));

      console.log('Sending to backend:', listsForBackend);

      // Sync with backend
      await updateBoard(id, listsForBackend);
      console.log('Task moved successfully');

      // Fetch the latest state from the server to ensure consistency
      await fetchBoard();
    } catch (err) {
      console.error('Failed to update board:', err);
      setError('Failed to update board');
      // Revert to original state on error
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
                boardId={id}
                setBoard={setBoard}
              />
            ))}
          </div>
        </DndProvider>
      </main>
      <Footer />
    </div>
  );
}
