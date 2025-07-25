import { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Header from '../components/Header';
import Footer from '../components/Footer';
import List from '../components/List';
import { getBoardById, updateBoard, searchTasks } from '../services/api';

// Utility helper to check if task matches query
const taskMatchesQuery = (task, query) => {
  if (!query) return true;
  const lc = query.toLowerCase();
  return (
    task.title.toLowerCase().includes(lc) ||
    (task.description && task.description.toLowerCase().includes(lc))
  );
};

export default function Board() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const boardRef = useRef(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Debounced search handler
  const debouncedSearch = useRef(
    debounce(async (query) => {
      if (!board) return;
      if (!query.trim()) {
        fetchBoard();
        setIsSearching(false);
        return;
      }

      try {
        const res = await searchTasks(id, query.trim());
        setBoard((prev) => ({ ...prev, lists: res.data }));
      } catch (err) {
        console.error('Search tasks error', err);
        // fallback handled by client filtering
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  // Trigger debounced search when query changes
  useEffect(() => {
    setIsSearching(true);
    debouncedSearch(searchQuery);
    // cleanup not required: debounced fn handles
  }, [searchQuery, debouncedSearch]);

  // Keep ref in sync with state
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const fetchBoard = async () => {
    try {
      const response = await getBoardById(id);
      // Ensure tasks arrays are properly initialized
      const boardData = {
        ...response.data,
        lists: response.data.lists.map((list) => ({
          ...list,
          tasks: Array.isArray(list.tasks) ? [...list.tasks] : [],
        })),
      };
      setBoard(boardData);
    } catch (err) {
      setError('Failed to fetch board');
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [id]);

  const moveTask = useCallback(
    async (item, toListIndex, toTaskIndex) => {
      const currentBoard = boardRef.current;
      if (!currentBoard) return;

      // Debug logs removed
      /* console.log('Moving task:', item);
      console.log('Current board state:', currentBoard);
      console.log('Board lists:', currentBoard.lists); */

      const { id: taskId, listId: fromListId } = item;

      const fromListIndex = currentBoard.lists.findIndex(
        (list) => list.id === fromListId
      );

      /* console.log('From list ID:', fromListId);
      console.log('From list index:', fromListIndex);
      console.log('Task ID being moved:', taskId); */

      if (fromListIndex === -1) {
        console.error('Source list not found:', fromListId);
        return;
      }

      if (toListIndex < 0 || toListIndex >= currentBoard.lists.length) {
        console.error('Invalid target list index:', toListIndex);
        return;
      }

      const newLists = currentBoard.lists.map((list) => ({
        ...list,
        tasks: Array.isArray(list.tasks) ? [...list.tasks] : [],
      }));

      const sourceList = newLists[fromListIndex];
      /* console.log('Source list:', sourceList);
      console.log('Source list tasks:', sourceList.tasks);
      console.log('Looking for task with ID:', taskId); */

      const taskToMove = sourceList.tasks.find((task) => {
        const taskIdStr = task._id?.toString() || task.id?.toString();
        const searchIdStr = taskId?.toString();
        /* console.log('Comparing task IDs:', { taskIdStr, searchIdStr }); */
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

      /* console.log('Found task to move:', taskToMove); */

      newLists[fromListIndex].tasks = sourceList.tasks.filter((task) => {
        const taskIdStr = task._id?.toString() || task.id?.toString();
        const searchIdStr = taskId?.toString();
        return taskIdStr !== searchIdStr;
      });

      const actualToIndex = Math.min(
        toTaskIndex,
        newLists[toListIndex].tasks.length
      );

      const taskToInsert = {
        ...taskToMove,
        _id: taskToMove._id || taskToMove.id,
      };

      newLists[toListIndex].tasks.splice(actualToIndex, 0, taskToInsert);

      /* console.log('Updated lists:', newLists); */

      const updatedBoard = {
        ...currentBoard,
        lists: newLists.map((list) => ({
          ...list,
          tasks: Array.isArray(list.tasks) ? [...list.tasks] : [],
        })),
      };

      setBoard(updatedBoard);

      try {
        const listsForBackend = newLists.map((list) => ({
          ...list,
          tasks: Array.isArray(list.tasks)
            ? list.tasks.map((task) => ({
                ...task,
                _id: task._id || task.id,
                id: undefined,
              }))
            : [],
        }));

        /* console.log('Sending to backend:', listsForBackend); */

        await updateBoard(id, listsForBackend);
        /* console.log('Task moved successfully'); */

        const response = await getBoardById(id);
        /* console.log('Fetched fresh board data:', response.data); */

        setBoard((prevBoard) => {
          const freshBoard = {
            ...response.data,
            lists: response.data.lists.map((list) => ({
              ...list,
              tasks: Array.isArray(list.tasks)
                ? list.tasks.map((task) => ({
                    ...task,
                    _id: task._id || task.id,
                  }))
                : [],
            })),
          };
          /* console.log('Setting final board state:', freshBoard); */
          return freshBoard;
        });
      } catch (err) {
        console.error('Failed to update board:', err);
        setError('Failed to update board');
        setBoard(board);
      }
    },
    [id]
  );

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
        <h2 className="text-2xl font-bold mb-2">{board.title}</h2>

        {/* Search bar */}
        <div className="mb-4 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                e.target.blur();
              }
              if (e.key === 'Enter') {
                // prevent form submission side-effects
                e.preventDefault();
              }
            }}
            aria-label="Search tasks by title or description"
            placeholder="Search tasks..."
            className="w-full p-2 pr-10 border rounded-lg border-gray-300 focus:outline-none focus:ring focus:ring-blue-200"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search input"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              ×
            </button>
          )}
        </div>

        {/* Searching indicator */}
        {isSearching && searchQuery.trim() && (
          <p className="text-sm text-gray-500 mb-2">Searching…</p>
        )}

        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-4 flex-wrap">
            {board.lists.map((list, listIndex) => (
              <List
                key={list.id}
                list={{
                  ...list,
                  tasks: list.tasks.filter((task) =>
                    taskMatchesQuery(task, searchQuery)
                  ),
                }}
                listIndex={listIndex}
                moveTask={moveTask}
                boardId={id}
                setBoard={setBoard}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </DndProvider>
      </main>
      <Footer />
    </div>
  );
}
