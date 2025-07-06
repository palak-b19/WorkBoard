// Authentication E2E tests

describe('Authentication Flow', () => {
  const timestamp = Date.now();
  const email = `testuser${timestamp}@example.com`;
  const password = 'Password123!';

  it('registers a new user and redirects to dashboard', () => {
    cy.visit('/register');

    cy.get('input#email').type(email);
    cy.get('input#password').type(password);
    cy.contains('button', /register/i).click();

    // After successful registration, user should land on dashboard
    cy.url().should('include', '/dashboard');

    // Token should be saved to localStorage
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string').and.not.be.empty;
    });
  });

  it('logs out and redirects to login page', () => {
    // Login via API to ensure token is present for this isolated test
    cy.loginApi({ email, password });
    cy.visit('/dashboard');

    cy.contains('button', /logout/i, { timeout: 10000 }).click();

    cy.url().should('include', '/login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('logs in with valid credentials', () => {
    cy.visit('/login');

    cy.get('input#email').type(email);
    cy.get('input#password').type(password);
    cy.contains('button', /login/i).click();

    cy.url().should('include', '/dashboard');
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string').and.not.be.empty;
    });
  });

  it('prevents access to protected route when not authenticated', () => {
    // Clear token then attempt to visit protected route
    cy.window().then((win) => win.localStorage.removeItem('token'));
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
