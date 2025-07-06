// Board Management E2E tests

describe('Board Management', () => {
  const timestamp = Date.now();
  const email = `boarduser${timestamp}@example.com`;
  const password = 'Password123!';
  const apiBase =
    Cypress.env('BACKEND_URL') || 'https://task-mvp-backend.herokuapp.com';
  let token;

  before(() => {
    // Register a user via API to speed things up
    cy.request('POST', `${apiBase}/api/auth/register`, {
      email,
      password,
    }).then((resp) => {
      expect(resp.status).to.equal(201);
      token = resp.body.token || resp.body?.data?.token;
    });
  });

  beforeEach(() => {
    // Persist token in localStorage before each test
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token);
      },
    });
  });

  it('creates a board via UI and displays it in dashboard', () => {
    cy.visit('/dashboard');
    const boardTitle = `Test Board ${timestamp}`;

    cy.get('input[placeholder="Enter board title"]').type(boardTitle);
    cy.contains('button', /create board/i).click();

    cy.contains('a', boardTitle).should('exist');
  });

  it('deletes a board via UI and removes it from the list', () => {
    const boardTitle = `To Delete ${timestamp}`;

    // create board via API for quicker setup
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/boards`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { title: boardTitle },
    }).then((createResp) => {
      expect(createResp.status).to.equal(201);
      const boardId = createResp.body._id || createResp.body?.data?._id;

      // visit dashboard to ensure board is present
      cy.visit('/dashboard');
      cy.contains('a', boardTitle)
        .should('exist')
        .parent()
        .within(() => {
          cy.contains('button', /delete/i).click();
        });

      // Confirm dialog is auto-handled by Cypress (defaults to true)

      // Ensure board no longer exists
      cy.contains('a', boardTitle).should('not.exist');

      // Additionally, verify via API that board is gone (expect 404)
      cy.request({
        method: 'GET',
        url: `${apiBase}/api/boards/${boardId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 404);
    });
  });
});
