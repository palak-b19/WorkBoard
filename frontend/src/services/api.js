import axios from 'axios';

const api = axios.create({
  baseURL: 'https://task-management-platform-746079896238.herokuapp.com/api',
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

export const getBoardById = (id) =>
  api.get(`/boards/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

export const updateBoard = (id, lists) =>
  api.patch(
    `/boards/${id}`,
    { lists },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );

export const createTask = (boardId, listId, task) =>
  api.post(
    `/boards/${boardId}/tasks`,
    { listId, ...task },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );

export default api;
