import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-100 min-h-[calc(100vh-8rem)]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Login
          </h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                className="block text-gray-700 mb-2 font-medium"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  submitted && !email ? 'border-red-500' : ''
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-5">
              <label
                className="block text-gray-700 mb-2 font-medium"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  submitted && !password ? 'border-red-500' : ''
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
          <p className="mt-5 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
