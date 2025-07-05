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
- Added task creation form in `List.jsx` for each list, with `submitted` state validation.
- Integrated with `createTask` API to add tasks to specific lists.
- Updated `Board.jsx` to pass `boardId` and `setBoard` to `List.jsx`

## Day 12 Frontend Progress (June 27, 2025)

- Added task deletion feature:
  - Introduced _Delete_ button in `Task.jsx` with a `window.confirm` prompt.
  - Wired up to new `deleteTask` helper in `src/services/api.js` (DELETE `/boards/:id/tasks/:taskId`).
  - After deletion the board is refetched with `getBoardById` to maintain state consistency.
- UI polish:
  - Disabled buttons while API requests are in-flight (`isDeleting`, `isSubmitting`, `isCreating`).
  - Added subtle hover/active styles for action links.
  - Centralised error handling for deletion failures.
- Refactored `api.js` to prefer `import.meta.env.VITE_API_URL` with localhost fallback (`http://localhost:3000/api`).
- Confirmed drag-and-drop functionality remains intact after deletion.


- Thoroughly tested analytics cards in `Dashboard.jsx`:
  - Verified loading, success, and error states.
  - Confirmed real-time updates when tasks are created, moved, or deleted.
  - Tested edge cases (0 tasks, no overdue tasks, invalid token, backend downtime).
  - Checked responsiveness at 1024 px / 1280 px and single-column mobile layout.
- UI polish:
  - Added `hover:-translate-y-1 hover:shadow-lg hover:bg-gray-50` transitions.
  - Used green text for completed count and red text for overdue > 0.
  - Ensured typography/spacing consistent with task cards (`text-lg font-semibold`).
- Cross-browser verification (Chrome v125, Firefox 126) – no React warnings.

Result: Analytics UI production-ready. _User Story #5 finished._

Next: Buffer/Testing phase – performance optimisation & optional features (e.g., board deletion).
