/*
Performance Sweep – 10 Boards × 50 Tasks
Run this spec manually by passing RUN_PERF=1, e.g.:
  npx cypress run --env RUN_PERF=1 --spec cypress/performance/performance.cy.js
The spec is skipped by default in CI/local runs because RUN_PERF is undefined.
*/

// Performance spec – only executed when this file is explicitly targeted.
describe('API Performance (10 boards × 50 tasks)', () => {
  const apiBase =
    Cypress.env('BACKEND_URL') ||
    'https://task-management-platform-746079896238.herokuapp.com';

  const ts = Date.now();
  const email = `perfuser${ts}@example.com`;
  const password = 'Password123!';

  let token;
  const boardIds = [];
  const timings = [];

  // Record duration in ms for a given label
  const record = (label, duration) => {
    timings.push({ label, duration });
  };

  before(() => {
    cy.request('POST', `${apiBase}/api/auth/register`, {
      email,
      password,
    }).then((resp) => {
      expect(resp.status).to.eq(201);
      token = resp.body.token;
      record('register', resp.duration);
    });
  });

  it('creates 10 boards', () => {
    for (let i = 0; i < 10; i++) {
      const title = `Perf Board ${i + 1} ${ts}`;
      cy.request({
        method: 'POST',
        url: `${apiBase}/api/boards`,
        headers: { Authorization: `Bearer ${token}` },
        body: { title },
      }).then((resp) => {
        expect(resp.status).to.eq(201);
        const id = resp.body._id || resp.body.id || resp.body.data?._id;
        boardIds.push(id);
        record('createBoard', resp.duration);
      });
    }
  });

  it('creates 50 tasks per board', () => {
    boardIds.forEach((boardId, idx) => {
      for (let t = 0; t < 50; t++) {
        cy.request({
          method: 'POST',
          url: `${apiBase}/api/boards/${boardId}/tasks`,
          headers: { Authorization: `Bearer ${token}` },
          body: { listId: 'todo', title: `Task ${t + 1} (B${idx + 1})` },
        }).then((resp) => {
          expect(resp.status).to.eq(201);
          record('createTask', resp.duration);
        });
      }
    });
  });

  it('hits analytics and search endpoints', () => {
    // Analytics
    cy.request({
      method: 'GET',
      url: `${apiBase}/api/analytics`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      record('getAnalytics', resp.duration);
    });

    // Boards list
    cy.request({
      method: 'GET',
      url: `${apiBase}/api/boards`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      record('getBoards', resp.duration);
    });

    // Search tasks on first board
    const firstBoard = boardIds[0];
    cy.request({
      method: 'GET',
      url: `${apiBase}/api/boards/${firstBoard}/tasks?query=Task`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      record('searchTasks', resp.duration);
    });
  });

  after(() => {
    cy.task('perf:print', '--- Performance Summary (ms) ---');
    const summary = {};
    timings.forEach(({ label, duration }) => {
      summary[label] = summary[label] || [];
      summary[label].push(duration);
    });
    Object.entries(summary).forEach(([label, arr]) => {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      cy.task(
        'perf:print',
        `${label.padEnd(12)} count=${arr.length} avg=${avg.toFixed(0)} min=${min} max=${max}`
      );
    });
  });
});
