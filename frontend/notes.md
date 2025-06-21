install: npm install react-dnd react-dnd-html5-backend.

Basic setup: Wrap app in DndProvider, use useDrag and useDrop.

Example snippet for reference (e.g., dragging a task card).

Login/Register UI tested: navigation, form submission, error handling.

- Registration: Tested valid/invalid inputs, redirect to /dashboard, JWT storage.
- Login: Tested valid/invalid credentials, redirect to /dashboard, JWT update.
- Logout: Tested from Header and Dashboard, verified token removal and redirect.
- Navigation: Tested all routes and protected /dashboard.
- Styling: Verified Tailwind styles and error borders after submission.

## Day 6 Frontend Progress

- Created `Board.jsx` with three static lists (To Do, In Progress, Done) using React-DnD.
- Added `/board` route, protected by `ProtectedRoute`.
- Updated `Dashboard.jsx` with link to `/board`.
- Tested UI: Lists display correctly, empty state shown, protected route enforced.
- Next: Implement board creation UI and API integration.

- Updated `Dashboard.jsx` with board creation form and board list UI.
- Integrated form with `createBoard` API, reused `submitted` state for validation.
- Tested form: Valid/invalid inputs, error handling, board list display.
- Next: Fetch boards from API, add dynamic board routing (Day 8).

- Updated `Dashboard.jsx` to fetch boards using `getBoards` API, added dynamic links to `/board/:id`.
- Updated `Board.jsx` to fetch specific board data using `getBoardById` API.
- Added `/board/:id` route in `main.jsx`.
- Tested: Board listing, dynamic routing, error/loading states.

-Added drag-and-drop for tasks in `Board.jsx` using React-DnD.

- Created `Task.jsx` and `List.jsx` for draggable tasks and droppable lists.
- Integrated with `updateBoard` API to persist task positions.
- Tested: Task movement between lists, error handling.
