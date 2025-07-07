/*
Performance Sweep – 10 Boards × 50 Tasks
Run this spec manually by passing RUN_PERF=1, e.g.:
  npx cypress run --env RUN_PERF=1 --spec cypress/performance/performance.cy.js
The spec is skipped by default in CI/local runs because RUN_PERF is undefined.
*/

const runPerf =
  Cypress.env('RUN_PERF') === '1' || Cypress.env('RUN_PERF') === 'true';

(runPerf ? describe : describe.skip)(
  'API Performance (10 boards × 50 tasks)',
  () => {
    const apiBase =
      Cypress.env('BACKEND_URL') ||
      'https://task-management-platform-746079896238.herokuapp.com';

    const ts = Date.now();
    const email = `perfuser${ts}@example.com`;
    const password = 'Password123!';

    let token;
    const boardIds = [];
    const timings = [];

    const record = (label, start) => {
      timings.push({ label, duration: Date.now() - start });
    };

    before(() => {
      const t0 = Date.now();
      cy.request('POST', `${apiBase}/api/auth/register`, {
        email,
        password,
      }).then((resp) => {
        expect(resp.status).to.eq(201);
        token = resp.body.token;
        record('register', t0);
      });
    });

    it('creates 10 boards', () => {
      for (let i = 0; i < 10; i++) {
        const title = `Perf Board ${i + 1} ${ts}`;
        const start = Date.now();
        cy.request({
          method: 'POST',
          url: `${apiBase}/api/boards`,
          headers: { Authorization: `Bearer ${token}` },
          body: { title },
        }).then((resp) => {
          expect(resp.status).to.eq(201);
          const id = resp.body._id || resp.body.id || resp.body.data?._id;
          boardIds.push(id);
          record('createBoard', start);
        });
      }
    });

    it('creates 50 tasks per board', () => {
      boardIds.forEach((boardId, idx) => {
        for (let t = 0; t < 50; t++) {
          const start = Date.now();
          cy.request({
            method: 'POST',
            url: `${apiBase}/api/boards/${boardId}/tasks`,
            headers: { Authorization: `Bearer ${token}` },
            body: { listId: 'todo', title: `Task ${t + 1} (B${idx + 1})` },
          }).then((resp) => {
            expect(resp.status).to.eq(201);
            record('createTask', start);
          });
        }
      });
    });

    it('hits analytics and search endpoints', () => {
      const startAnalytics = Date.now();
      cy.request({
        method: 'GET',
        url: `${apiBase}/api/analytics`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        record('getAnalytics', startAnalytics);
      });

      // Hit boards list
      const startBoards = Date.now();
      cy.request({
        method: 'GET',
        url: `${apiBase}/api/boards`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        record('getBoards', startBoards);
      });

      // Search tasks on first board
      const firstBoard = boardIds[0];
      const startSearch = Date.now();
      cy.request({
        method: 'GET',
        url: `${apiBase}/api/boards/${firstBoard}/tasks?query=Task`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        record('searchTasks', startSearch);
      });
    });

    after(() => {
      cy.log('--- Performance Summary (ms) ---');
      const summary = {};
      timings.forEach(({ label, duration }) => {
        summary[label] = summary[label] || [];
        summary[label].push(duration);
      });
      Object.entries(summary).forEach(([label, arr]) => {
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const max = Math.max(...arr);
        const min = Math.min(...arr);
        cy.log(
          `${label}: count=${arr.length} avg=${avg.toFixed(0)} min=${min} max=${max}`
        );
      });
    });
  }
);
