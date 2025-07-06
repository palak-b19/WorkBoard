Cypress.Commands.add('registerApi', ({ email, password }) => {
  cy.request(
    'POST',
    `${Cypress.env('BACKEND_URL') || 'https://task-mvp-backend.herokuapp.com'}/api/auth/register`,
    {
      email,
      password,
    }
  ).then((resp) => {
    expect(resp.status).to.eq(201);
    return resp.body.token || resp.body?.token || resp.body?.data?.token;
  });
});

Cypress.Commands.add('loginApi', ({ email, password }) => {
  cy.request(
    'POST',
    `${Cypress.env('BACKEND_URL') || 'https://task-mvp-backend.herokuapp.com'}/api/auth/login`,
    {
      email,
      password,
    }
  ).then((resp) => {
    expect(resp.status).to.eq(200);
    const token = resp.body.token || resp.body?.data?.token;
    window.localStorage.setItem('token', token);
    return token;
  });
});

// Command to set token in localStorage directly
Cypress.Commands.add('setToken', (token) => {
  window.localStorage.setItem('token', token);
});
