## Deployment

- Backend deployed to Heroku: [<heroku-url>](https://task-management-platform-746079896238.herokuapp.com/)
- Authentication tested on: Register, Login, Validate, Logout functional.
- Frontend: Vite dev server on localhost:5173 (feature/tasks branch)
- Test user: user6@example.com / **\*\*\*\***
- Browser: Chrome v125 @ 1280 × 800

## Integration Testing

- Prepared `createBoard` API call, skipped testing due to undeployed branch.
- Tested board creation form with `POST /api/boards`. Created board, verified in MongoDB Atlas.

## Steps & Results

1. Login → Dashboard → open existing board `/board/:id`  
   Board and lists rendered.

2. Edit a task  
   • UI: clicked Edit → inline form appeared with title, description, due-date fields.  
   • Sent `PATCH /api/boards/:id/tasks/:taskId` → 200 OK.  
   • Board state refreshed; updated title/description/date displayed; drag-and-drop still works.

3. Validation checks  
   | Payload | Expected | Actual |
   |---------|----------|--------|
   | Empty title | 400 "Task title is required" |  
   | Title 101 chars | 400 "cannot exceed 100 characters" | |
   | Description 501 chars | 400 |
   | Past dueDate | 400 "must be in the future" |
   | `<script>alert('xss')</script>` | 400 validation error (title empty after sanitisation) – XSS blocked |

4. Created/edited 5 tasks across lists → refreshed page → all changes persisted (verified with `GET /api/boards/:id`).

5. MongoDB Atlas check: task `createdAt` unchanged; \_id preserved; total tasks ≤ 100 per list.

## Day 12 – Task Deletion Integration Test

Environment

- Backend: Heroku (`task-mvp-backend`) – release v23
- Frontend: feature/tasks branch on Vite dev server (localhost:5173) with `VITE_API_URL` pointing to Heroku API

Scenarios & Results

1. Delete flow – UI "Delete" → confirm → `DELETE /boards/:id/tasks/:taskId` → **200 OK**, task removed, board refreshed.
2. Cancel prompt – selecting _Cancel_ leaves task untouched.
3. Re-delete same task – **404 Task not found** handled gracefully.
4. Invalid token – **401**, frontend redirects to /login.
5. Backend down – error toast "Failed to delete task".

Performance: avg 180 ms for delete with 20 tasks.

Branch feature/tasks merged to **main** and deployed; Heroku logs show successful dyno restart.

## Day 14 – Analytics Integration Test

Environment

- Backend: local dev (feature/analytics) – aggregation pipeline hot-reload
- Frontend: feature/analytics branch on Vite dev server (localhost:5173) with automatic baseURL switching (`http://localhost:3000/api`).
- Test user: user6@example.com

Scenarios & Results

1. Load Dashboard → analytics cards show loading spinner then 15 / 4 / 1 (total/completed/overdue) — matches seed data.
2. Move an existing "todo" task to Done ⇒ `PATCH /boards/:id` then `GET /analytics` — completed count incremented by 1 (bug fixed).
3. Create a new task, move to Done ⇒ metrics update in <2 s.
4. Overdue calculation: set `dueDate` to yesterday, leave in In Progress ⇒ overdue count increments.
5. Invalid token ⇒ 401 handled, frontend redirects to /login.
6. Backend down ⇒ frontend shows "Failed to load analytics" but boards still render (graceful degradation).

Performance: aggregation pipeline returns in 120–150 ms with 100 tasks across 5 boards.

.
