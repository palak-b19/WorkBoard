import axios from 'axios';

const api = axios.create({
  baseURL: 'https://task-management-platform-746079896238.herokuapp.com/api', // Update to Heroku URL later
});

export const register = (email, password) =>
  api.post('/auth/register', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export default api;
