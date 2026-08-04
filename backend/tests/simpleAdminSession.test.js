const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const simpleAdminRoutes = require("../routes/simpleAdminRoutes");

test("GET /api/admin/session reports authentication state from the admin cookie", async () => {
  const app = express();
  app.use("/api/admin", simpleAdminRoutes);

  const server = app.listen(0);
  const { port } = await new Promise((resolve) =>
    server.once("listening", () => resolve(server.address())),
  );

  try {
    const unauthenticatedResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/session`,
    );
    const unauthenticatedPayload = await unauthenticatedResponse.json();

    assert.equal(unauthenticatedResponse.status, 200);
    assert.equal(unauthenticatedPayload.authenticated, false);

    const authenticatedResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/session`,
      {
        headers: {
          cookie: "bindaud_admin_session=admin-token-2026",
        },
      },
    );
    const authenticatedPayload = await authenticatedResponse.json();

    assert.equal(authenticatedResponse.status, 200);
    assert.equal(authenticatedPayload.authenticated, true);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
