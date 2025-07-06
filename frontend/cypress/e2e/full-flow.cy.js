// Full Application Flow E2E tests
// Covers: authentication → boards → tasks → search → board deletion → analytics

// NOTE: This test intentionally walks through the *entire* happy-path flow in a
// single spec to simulate a real user journey. Keeping it in one file avoids
// repeated registration/login overhead and ensures state continuity.

describe('Full Application Flow', () => {
  const ts = Date.now();
  const email = `fullflow${ts}@example.com`;
  const password = 'Password123!';
  const boardOne = `Test Board 1 ${ts}`;
  const boardTwo = `Test Board 2 ${ts}`;

  let token; // <-- persist token across tests
  const apiBase =
    Cypress.env('BACKEND_URL') ||
    'https://task-management-platform-746079896238.herokuapp.com';
  let boardOneId;

  // Preserve authentication between tests by restoring the token
  beforeEach(() => {
    if (token) {
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
        },
      });
    }
  });

  const taskTitles = [
    'Task 1',
    'Urgent fix prod',
    'Task 3',
    'Urgent: send report',
    'Task 5',
  ];

  /* 1️⃣  Authentication */
  it('registers and logs a user in', () => {
    cy.viewport(1280, 720); // default desktop

    cy.visit('/register');

    cy.get('input#email').type(email);
    cy.get('input#password').type(password);
    cy.contains('button', /register/i).click();

    // Redirects to dashboard and token saved
    cy.url().should('include', '/dashboard');
    cy.window().then((win) => {
      const t = win.localStorage.getItem('token');
      expect(t).to.be.a('string').and.not.be.empty;
      token = t; // cache for later tests
    });
  });

  /* 2️⃣  Board creation */
  it('creates two boards from the dashboard', () => {
    cy.log('Navigating to dashboard for board creation');
    cy.visit('/dashboard');

    // Intercept board creation API to await server response
    cy.intercept('POST', '**/api/boards').as('createBoard');

    // Helper to create a board via UI and confirm
    const createBoard = (title) => {
      cy.log(`Creating board: ${title}`);
      cy.get('input[placeholder="Enter board title"]').clear().type(title);
      cy.contains('button', /create board/i).click();
      cy.wait('@createBoard').then((interception) => {
        expect(interception.response.statusCode).to.eq(201);
        // capture boardOneId for API task creation
        if (title === boardOne) {
          boardOneId =
            interception.response.body._id ||
            interception.response.body.id ||
            interception.response.body.data?._id;
          cy.log(`Captured boardOneId: ${boardOneId}`);
        }
      });
      cy.contains('a', title, { timeout: 10000 }).should('exist');
    };

    createBoard(boardOne);

    // Force re-fetch of boards to ensure React state sync
    cy.reload();
    cy.contains('a', boardOne).should('exist');

    createBoard(boardTwo);
  });

  /* 3️⃣  Task management on first board */
  it('adds, edits, deletes, and searches tasks within a board', () => {
    cy.log('Opening dashboard to access first board');
    cy.visit('/dashboard');

    // Wait for boards list to load
    cy.contains('a', boardOne, { timeout: 10000 }).should('exist').click();

    cy.url().should('match', /\/board\//);
    cy.log('On board page, preparing to add tasks');

    // Ensure search bar available
    cy.get('input[aria-label="Search tasks by title or description"]').as(
      'searchBar'
    );

    // Create tasks through backend API to avoid DOM duplication issues
    cy.log('Creating tasks via API');
    cy.location('pathname').then((path) => {
      const currentBoardId = boardOneId || path.split('/').pop();
      taskTitles.forEach((title) => {
        cy.request({
          method: 'POST',
          url: `${apiBase}/api/boards/${currentBoardId}/tasks`,
          headers: { Authorization: `Bearer ${token}` },
          body: { listId: 'todo', title },
        });
      });
    });

    // Reload to see tasks in UI
    cy.reload();

    // Verify tasks appear
    taskTitles.forEach((title) => {
      cy.contains('.bg-white', title, { timeout: 10000 }).should('exist');
    });

    // Delete a task
    cy.log('Deleting Task 5');
    cy.contains('.bg-white', 'Task 5')
      .first()
      .within(() => {
        cy.contains('button', /delete/i).click();
      });
    cy.contains('.bg-white', 'Task 5', { timeout: 10000 }).should('not.exist');

    // Search functionality
    cy.log('Verifying search works for "urgent"');
    cy.get('@searchBar').type('urgent');
    cy.contains('.bg-white', 'Urgent fix prod').should('exist');
    cy.contains('.bg-white', 'Urgent: send report').should('exist');
    cy.contains('.bg-white', 'Task 1').should('not.exist');

    // Clear search
    cy.contains('button', '×').click();
    cy.contains('.bg-white', 'Task 1').should('exist');

    // Responsiveness check
    cy.viewport(1024, 768);
    cy.get('h2').should('be.visible');
    cy.viewport(1280, 800);

    cy.log('Skipping inline edit – covered in tasks.cy.js');
  });

  /* 4️⃣  Board deletion and analytics */
  it('deletes the second board and validates analytics', () => {
    cy.log('Navigating to dashboard for board deletion');
    cy.visit('/dashboard');

    cy.contains('a', boardTwo, { timeout: 10000 })
      .should('exist')
      .parent()
      .within(() => {
        cy.contains('button', /delete/i).click();
      });

    cy.contains('a', boardTwo).should('not.exist');

    // Analytics assertions
    const assertNumeric = (label, min = 0) => {
      cy.contains('div', label)
        .should('exist')
        .within(() => {
          cy.get('p.text-2xl')
            .invoke('text')
            .then((txt) => {
              const num = parseInt(txt, 10);
              expect(num).to.be.at.least(min);
            });
        });
    };

    assertNumeric('Total Tasks', 4);
    assertNumeric('Completed Tasks');
    assertNumeric('Overdue Tasks');
  });
});
