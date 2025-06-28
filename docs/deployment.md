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

## Day 12 – Task Deletion Integration Test (27 Jun 2025)

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

.
