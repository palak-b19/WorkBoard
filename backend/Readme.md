## API Endpoints

- POST /api/auth/register
  - Body: { "email": string, "password": string }
  - Response: 201 { "token": string } or 400/500 { "error": string }
- POST /api/auth/login
  - Body: { "email": string, "password": string }
  - Response: 200 { "token": string } or 400/401/500 { "error": string }
- GET /api/auth/validate
  - Headers: Authorization: Bearer <token>
  - Response: 200 { "userId": string } or 401 { "error": string }
- POST /api/boards

  - Headers: Authorization: Bearer <token>
  - Body: { "title": string }
  - Response: 201 { board: object } or 400/401/500 { "error": string }

- POST /api/boards
  - Headers: Authorization: Bearer <token>
  - Body: { "title": string }
  - Response: 201 { board: object } or 400/401/500 { "error": string }
- GET /api/boards

  - Headers: Authorization: Bearer <token>
  - Response: 200 [ { _id: string, title: string, createdAt: date } ] or 401/500 { "error": string }

- GET /api/boards/:id

  - Headers: Authorization: Bearer <token>
  - Response: 200 { board: object } or 401/404/500 { "error": string }

- PATCH /api/boards/:id

  - Headers: Authorization: Bearer <token>
  - Body: { lists: array }
  - Response: 200 { board: object } or 400/401/404/500 { "error": string }

- POST /api/boards
  - Headers: Authorization: Bearer <token>
  - Body: { "title": string }
  - Response: 201 { board: object } or 400/401/500 { "error": string }
- GET /api/boards

  - Headers: Authorization: Bearer <token>
  - Response: 200 [ { _id: string, title: string, createdAt: date } ] or 401/500 { "error": string }

- GET /api/boards/:id

  - Headers: Authorization: Bearer <token>
  - Response: 200 { board: object } or 401/404/500 { "error": string }

- PATCH /api/boards/:id

  - Headers: Authorization: Bearer <token>
  - Body: { lists: array }
  - Response: 200 { board: object } or 400/401/404/500 { "error": string }

- POST /api/boards/:id/tasks

  - Headers: Authorization: Bearer <token>
  - Body: { listId: string, title: string, description: string (optional), dueDate: string (optional, YYYY-MM-DD) }
  - Response: 201 { board: object } or 400/401/404/500 { "error": string }
  - Notes: Sanitizes title/description for XSS, validates listId (todo, inprogress, done)

- PATCH /api/boards/:id/tasks/:taskId

  - Headers: Authorization: Bearer <token>
  - Body: { listId: string, title: string, description: string (optional), dueDate: string (optional, YYYY-MM-DD) }
  - Response: 200 { board: object } or 400/401/404/500 { "error": string }
  - Notes: Sanitizes title/description for XSS, validates listId (todo, inprogress, done), ensures title is 1-100 chars, description ≤ 500 chars, dueDate is a valid future date. The `createdAt` timestamp on the task is preserved, and the 100-tasks-per-list limit still applies.

- DELETE /api/boards/:id/tasks/:taskId

  - Headers: Authorization: Bearer <token>
  - Body: (none)
  - Response: 200 { board: object } or 401/404/500 { "error": string }
  - Notes: Removes the specified task from whichever list contains it. Validates board/task IDs and user ownership. Task limits (≤100 per list) are preserved automatically after removal.

  ## Backend Status

- Authentication complete: Register, Login, Validate endpoints with JWT.
- Feature branch `feature/auth-api` merged into `main`.
