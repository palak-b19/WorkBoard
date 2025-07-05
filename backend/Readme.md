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
  - Response:
    - 200 { board: object } – Task deleted successfully and updated board returned
    - 401 { "error": string } – Missing or invalid JWT
    - 404 { "error": string } – Board or task not found, or IDs are malformed
    - 500 { "error": string } – Server error
  - Notes:
    - Validates both `id` (board) and `taskId` parameters are 24-character Mongo ObjectIds.
    - Ensures the authenticated user owns the board.
    - Locates the task in any list (todo/inprogress/done) and removes it.
    - The 100-tasks-per-list constraint is naturally preserved after deletion.

- GET /api/analytics

  - Headers: Authorization: Bearer <token>
  - Body: (none)
  - Response:
    - 200 { totalTasks: number, completedTasks: number, overdueTasks: number }
    - 401 { "error": string } – Missing or invalid JWT
    - 500 { "error": string } – Server error
  - Notes:
    - Aggregates all boards owned by the user using a MongoDB aggregation pipeline (unwinds lists & tasks).
    - `completedTasks` counts tasks in the **Done** list; `overdueTasks` counts tasks past their `dueDate` and not in **Done**.
    - Optimised with aggregation and `userId` index to keep response time < 2 s for ~100 tasks.

  ## Backend Status

- Authentication complete: Register, Login, Validate endpoints with JWT.
- Feature branch `feature/auth-api` merged into `main`.
- Task management endpoints (create, update, delete) implemented — _User Story #4_ completed on June 27, 2025.
- Feature branch `feature/tasks` merged into `main`
- Analytics endpoint (`GET /api/analytics`) fully tested with 100-task dataset — _User Story #5_ 
