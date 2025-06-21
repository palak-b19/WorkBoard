import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Heroku URL
});

export const register = (email, password) =>
  api.post('/auth/register', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const createBoard = (title) =>
  api.post(
    '/boards',
    { title },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );

export const getBoards = () =>
  api.get('/boards', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

export default api;
