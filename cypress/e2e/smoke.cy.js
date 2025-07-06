// First smoke test suite for the Task-Management Platform

describe("Smoke Test", () => {
  // Verify backend is up
  it("backend /health returns 200", () => {
    cy.request(
      "https://task-management-platform-746079896238.herokuapp.com/health",
    )
      .its("status")
      .should("eq", 200);
  });

  // Verify the login page renders (requires the frontend dev server or preview to be running)
  it("login page loads", () => {
    cy.visit("/login");
    cy.contains(/login/i).should("exist");
  });
});
