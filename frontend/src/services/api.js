import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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

export const createTask = (boardId, listId, task) => {
  console.log('Creating task with data:', { boardId, listId, task });
  return api
    .post(
      `/boards/${boardId}/tasks`,
      {
        listId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString()
          : undefined,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    )
    .then((response) => {
      console.log('Create task response:', response.data);
      return response;
    });
};

export const updateTask = (
  boardId,
  taskId,
  listId,
  taskData // { title, description, dueDate }
) => {
  console.log('Updating task:', { boardId, taskId, listId, taskData });
  return api.patch(
    `/boards/${boardId}/tasks/${taskId}`,
    {
      listId,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate
        ? new Date(taskData.dueDate).toISOString()
        : undefined,
    },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }
  );
};

export default api;
