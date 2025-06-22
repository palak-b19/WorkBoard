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

  ## Backend Status

- Authentication complete: Register, Login, Validate endpoints with JWT.
- Feature branch `feature/auth-api` merged into `main`.
