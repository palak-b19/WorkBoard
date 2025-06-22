import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { createBoard, getBoards } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [boards, setBoards] = useState([]);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await getBoards();
        setBoards(response.data);
      } catch (err) {
        setFetchError('Failed to fetch boards');
      }
    };
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!title) return;
    try {
      const response = await createBoard(title);
      setBoards([...boards, response.data]);
      setTitle('');
      setSubmitted(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create board');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p>Welcome to your task management dashboard!</p>
        <form onSubmit={handleCreateBoard} className="mt-4 max-w-md">
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title"
              className={`w-full p-2 border rounded-lg ${
                submitted && !title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {submitted && !title && (
              <p className="text-red-500 text-sm mt-1">Title is required</p>
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Create Board
          </button>
        </form>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Your Boards</h3>
          {fetchError && (
            <p className="text-red-500 text-sm mb-2">{fetchError}</p>
          )}
          {boards.length === 0 ? (
            <p className="text-gray-500">No boards created yet</p>
          ) : (
            <ul className="space-y-2">
              {boards.map((board) => (
                <li key={board._id}>
                  <Link
                    to={`/board/${board._id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {board.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          to="/board"
          className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          View Kanban Board
        </Link>
        <button
          onClick={handleLogout}
          className="mt-4 ml-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </main>
      <Footer />
    </div>
  );
}
