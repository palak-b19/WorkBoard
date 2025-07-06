// Analytics E2E tests

const apiBase =
  Cypress.env('BACKEND_URL') ||
  'https://task-management-platform-746079896238.herokuapp.com';

describe('Analytics Cards', () => {
  const ts = Date.now();
  const email = `analytics${ts}@example.com`;
  const password = 'Password123!';
  let token;
  let boardId;

  before(() => {
    cy.request('POST', `${apiBase}/api/auth/register`, { email, password })
      .then((resp) => {
        expect(resp.status).to.eq(201);
        token = resp.body.token;

        // create board only after token is ready
        return cy.request({
          method: 'POST',
          url: `${apiBase}/api/boards`,
          headers: { Authorization: `Bearer ${token}` },
          body: { title: `Analytics Board ${ts}` },
        });
      })
      .then((resp) => {
        boardId = resp.body._id || resp.body.id || resp.body.data?._id;
      });
  });

  const setToken = () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token);
      },
    });
  };

  it('shows zeros when no tasks exist', () => {
    setToken();
    cy.visit('/dashboard');
    cy.contains('Total Tasks').parent().should('contain', '0');
    cy.contains('Completed Tasks').parent().should('contain', '0');
    cy.contains('Overdue Tasks').parent().should('contain', '0');
  });

  it('updates totals after creating tasks', () => {
    // create 2 tasks (1 done, 1 todo)
    const makeTask = (body) =>
      cy.request({
        method: 'POST',
        url: `${apiBase}/api/boards/${boardId}/tasks`,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

    makeTask({ listId: 'todo', title: 'Task A' });
    makeTask({ listId: 'done', title: 'Task B' });

    setToken();
    cy.visit('/dashboard');

    cy.contains('Total Tasks').parent().should('contain', '2');
    cy.contains('Completed Tasks').parent().should('contain', '1');
  });
});
