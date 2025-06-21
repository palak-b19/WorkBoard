install: npm install react-dnd react-dnd-html5-backend.

Basic setup: Wrap app in DndProvider, use useDrag and useDrop.

Example snippet for reference (e.g., dragging a task card).

Login/Register UI tested: navigation, form submission, error handling.

- Registration: Tested valid/invalid inputs, redirect to /dashboard, JWT storage.
- Login: Tested valid/invalid credentials, redirect to /dashboard, JWT update.
- Logout: Tested from Header and Dashboard, verified token removal and redirect.
- Navigation: Tested all routes and protected /dashboard.
- Styling: Verified Tailwind styles and error borders after submission.
