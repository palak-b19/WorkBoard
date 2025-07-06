// Smoke E2E tests for Task Management Platform
// checks if site is up and running, else no point to run further tests

describe('Smoke Test', () => {
  it('backend /health returns 200', () => {
    cy.request(
      'https://task-management-platform-746079896238.herokuapp.com/health'
    )
      .its('status')
      .should('eq', 200);
  });

  it('login page loads', () => {
    cy.visit('/login');
    cy.contains(/login/i).should('exist');
  });
});
