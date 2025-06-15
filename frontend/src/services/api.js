import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Update to Heroku URL later
});

export const register = (email, password) =>
  api.post('/auth/register', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export default api;