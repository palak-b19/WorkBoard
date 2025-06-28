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

.
