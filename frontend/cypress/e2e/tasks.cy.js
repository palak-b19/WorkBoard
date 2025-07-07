// Task Management E2E tests

const apiBase =
  Cypress.env('BACKEND_URL') ||
  'https://task-management-platform-746079896238.herokuapp.com';

describe('Task Management', () => {
  const ts = Date.now();
  const email = `taskuser${ts}@example.com`;
  const password = 'Password123!';
  let token;
  let boardId;

  before(() => {
    cy.request('POST', `${apiBase}/api/auth/register`, { email, password })
      .then((resp) => {
        expect(resp.status).to.eq(201);
        token = resp.body.token;

        // create board once token available
        return cy.request({
          method: 'POST',
          url: `${apiBase}/api/boards`,
          headers: { Authorization: `Bearer ${token}` },
          body: { title: `Board ${ts}` },
        });
      })
      .then((resp) => {
        expect(resp.status).to.eq(201);
        boardId = resp.body._id || resp.body.id || resp.body.data?._id;
      });
  });

  beforeEach(() => {
    // set token before each test
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token);
      },
    });
  });

  it('creates a new task through the UI', () => {
    cy.visit(`/board/${boardId}`);

    cy.get('input[placeholder="Enter task title"]').first().type('Test Task');
    cy.contains('button', /add task/i).click();

    cy.contains('.bg-white', 'Test Task').should('exist');
  });

  it('edits a task through the UI', () => {
    // create task via API first
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/boards/${boardId}/tasks`,
      headers: { Authorization: `Bearer ${token}` },
      body: { listId: 'todo', title: 'Original Task' },
    }).then(() => {
      // Visit board and wait for it to load
      cy.visit(`/board/${boardId}`);

      // Wait for task to be visible and click Edit
      cy.contains('.bg-white', 'Original Task', { timeout: 10000 })
        .should('be.visible')
        .within(() => {
          cy.get('[data-cy="edit-task"]').should('be.visible').click();
        });

      // Wait for form to appear and edit task
      cy.get('[data-cy="task-title-input"]')
        .should('be.visible')
        .should('have.value', 'Original Task')
        .clear()
        .type('Updated Task');

      // Click save and verify (wait for API)
      cy.intercept('PATCH', '**/api/boards/**/tasks/**').as('updateTask');
      cy.get('[data-cy="save-task"]').should('be.visible').click();
      cy.wait('@updateTask').its('response.statusCode').should('eq', 200);

      // Verify the update
      cy.contains('.bg-white', 'Updated Task', { timeout: 10000 }).should(
        'be.visible'
      );
    });
  });

  it('deletes a task through the UI', () => {
    // create task via API
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/boards/${boardId}/tasks`,
      headers: { Authorization: `Bearer ${token}` },
      body: { listId: 'todo', title: 'Delete Me' },
    }).then(() => {
      cy.visit(`/board/${boardId}`);

      // open edit form
      cy.contains('h4', 'Delete Me')
        .first()
        .then(($h4) => {
          cy.wrap($h4)
            .closest('.bg-white')
            .find('button')
            .contains('Delete')
            .click();
        });

      // reload to ensure board state updated
      cy.reload();

      cy.contains('.bg-white', 'Delete Me', { timeout: 10000 }).should(
        'not.exist'
      );
    });
  });

  it('filters tasks with the search bar', () => {
    // create two tasks
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/boards/${boardId}/tasks`,
      headers: { Authorization: `Bearer ${token}` },
      body: { listId: 'todo', title: 'Urgent: call client' },
    });
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/boards/${boardId}/tasks`,
      headers: { Authorization: `Bearer ${token}` },
      body: { listId: 'todo', title: 'Write documentation' },
    });

    cy.visit(`/board/${boardId}`);

    cy.get('input[aria-label="Search tasks by title or description"]').type(
      'urgent'
    );

    cy.contains('.bg-white', 'Urgent: call client').should('exist');
    cy.contains('.bg-white', 'Write documentation').should('not.exist');

    // clear
    cy.contains('button', '×').click();
    cy.contains('.bg-white', 'Write documentation').should('exist');
  });
});
